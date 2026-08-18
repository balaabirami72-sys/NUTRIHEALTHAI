import type { Mineral } from "./nutrition";

// USDA FoodData Central nutrient number → our key + unit conversion.
// All SR/Foundation/Survey foods report nutrients per 100g of edible portion.
type Mapping = { key: Mineral; toUnit: (raw: number, unitName: string) => number };

const NUTRIENT_MAP: Record<string, Mapping> = {
  // Macros (g)
  "203": { key: "protein",        toUnit: (v) => v },
  "204": { key: "fat",            toUnit: (v) => v },
  "205": { key: "carbohydrates",  toUnit: (v) => v },
  "291": { key: "fiber",          toUnit: (v) => v },
  "606": { key: "saturated_fat",  toUnit: (v) => v },
  // Minerals
  "301": { key: "calcium",    toUnit: (v) => v },
  "303": { key: "iron",       toUnit: (v) => v },
  "304": { key: "magnesium",  toUnit: (v) => v },
  "305": { key: "phosphorus", toUnit: (v) => v },
  "306": { key: "potassium",  toUnit: (v) => v },
  "307": { key: "sodium",     toUnit: (v) => v },
  "309": { key: "zinc",       toUnit: (v) => v },
  "312": { key: "copper",     toUnit: (v) => v },
  "315": { key: "manganese",  toUnit: (v) => v },
  "317": { key: "selenium",   toUnit: (v) => v }, // µg
  // Vitamins
  "320": { key: "vitamin_a",  toUnit: (v) => v }, // µg RAE
  "401": { key: "vitamin_c",  toUnit: (v) => v }, // mg
  "328": { key: "vitamin_d",  toUnit: (v) => v }, // µg
  "324": { key: "vitamin_d",  toUnit: (v) => v / 40 }, // IU → µg fallback
  "323": { key: "vitamin_e",  toUnit: (v) => v }, // mg
  "430": { key: "vitamin_k",  toUnit: (v) => v }, // µg
  "404": { key: "thiamin",          toUnit: (v) => v },
  "405": { key: "riboflavin",       toUnit: (v) => v },
  "406": { key: "niacin",           toUnit: (v) => v },
  "410": { key: "pantothenic_acid", toUnit: (v) => v },
  "415": { key: "vitamin_b6",       toUnit: (v) => v },
  "435": { key: "folate",           toUnit: (v) => v }, // DFE µg preferred
  "417": { key: "folate",           toUnit: (v) => v }, // total µg fallback
  "418": { key: "vitamin_b12",      toUnit: (v) => v }, // µg
};

// Trace elements that USDA SR rarely reports — keep at 0 to avoid hallucinated spikes.
export const HARDCODED_ZERO: Mineral[] = [
  "sulfur", "chloride", "chlorine", "fluoride", "molybdenum",
  "cobalt", "vanadium", "nickel", "iodine", "chromium", "biotin",
];

type SearchResp = {
  foods?: Array<{
    description: string;
    dataType?: string;
    score?: number;
    foodNutrients?: Array<{
      nutrientNumber?: string;
      nutrientId?: number;
      nutrientName?: string;
      unitName?: string;
      value?: number;
    }>;
  }>;
};

const cache = new Map<string, Partial<Record<Mineral, number>> | null>();

/** Returns per-100g nutrient profile for the best USDA match, or null if none. */
export async function lookupUsdaPer100g(query: string): Promise<Partial<Record<Mineral, number>> | null> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return null;
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", key);
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) { cache.set(key, null); return null; }
    const json = (await res.json()) as SearchResp;
    const top = json.foods?.[0];
    if (!top?.foodNutrients) { cache.set(key, null); return null; }

    const profile: Partial<Record<Mineral, number>> = {};
    for (const n of top.foodNutrients) {
      const code = n.nutrientNumber || String(n.nutrientId ?? "");
      const map = NUTRIENT_MAP[code];
      if (!map) continue;
      const raw = Number(n.value);
      if (!Number.isFinite(raw)) continue;
      const v = map.toUnit(raw, String(n.unitName || ""));
      // Prefer the first occurrence (DFE folate before total folate, µg D before IU D).
      if (profile[map.key] === undefined) profile[map.key] = v;
    }
    cache.set(key, profile);
    return profile;
  } catch (err) {
    console.warn("USDA lookup failed for", key, err);
    cache.set(key, null);
    return null;
  }
}

export type Answer = { label: string; value: string };

/** Adjustment multipliers / additions derived from clarifying answers. */
export function deriveAnswerAdjustments(answers: Answer[]) {
  let portionMult = 1.0;
  let addedFatG = 0;
  let addedSatG = 0;
  let addedSodiumMg = 0;

  for (const a of answers) {
    const label = a.label.toLowerCase();
    const v = (a.value || "").toLowerCase();
    if (label.includes("portion") || label.includes("size")) {
      if (v.includes("small")) portionMult = 0.7;
      else if (v.includes("large")) portionMult = 1.35;
    }
    if (label.includes("fat") || label.includes("oil") || label.includes("cook")) {
      if (v.includes("butter")) { addedFatG += 10; addedSatG += 6; }
      else if (v.includes("ghee")) { addedFatG += 12; addedSatG += 7.5; }
      else if (v.includes("olive") || v.includes("oil")) { addedFatG += 12; addedSatG += 1.8; }
    }
    if (label.includes("salt") || label.includes("season")) {
      if (v.includes("light")) addedSodiumMg += 400;
      else if (v.includes("heavy")) addedSodiumMg += 1200;
    }
    if (label.includes("dairy") || label.includes("cheese")) {
      if (v.includes("little")) { addedFatG += 4; addedSatG += 2.5; }
      else if (v.includes("lot")) { addedFatG += 10; addedSatG += 6; }
    }
  }
  return { portionMult, addedFatG, addedSatG, addedSodiumMg };
}