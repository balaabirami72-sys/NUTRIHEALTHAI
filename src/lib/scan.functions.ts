import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { lookupUsdaPer100g, deriveAnswerAdjustments, HARDCODED_ZERO } from "./usda.server";
import { MINERALS, emptyMinerals, type Mineral } from "./nutrition";

type FoodEstimate = { name: string; grams: number };
type ClarifyingQuestion = { id: string; label: string; options: string[] };

const IdentifyInput = z.object({
  imageDataUrl: z.string().min(20),
});

const IdentifyTextInput = z.object({
  text: z.string().min(2),
});

const QuestionSchema = z.object({
  id: z.string(),
  label: z.string(),
  options: z.array(z.string()),
});

const IdentifySchema = z.object({
  name: z.string(),
  foods: z.array(z.object({ name: z.string(), grams: z.number() })),
  questions: z.array(QuestionSchema),
});

function extractJson(raw: string) {
  const trimmed = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const objectStart = trimmed.indexOf("{");
    const arrayStart = trimmed.indexOf("[");
    const startsWithArray = arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart);
    const start = startsWithArray ? arrayStart : objectStart;
    const end = startsWithArray ? trimmed.lastIndexOf("]") : trimmed.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("AI response did not include JSON");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function cleanFoods(value: unknown): FoodEstimate[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = String(record.name || "").trim();
      const grams = Number(record.grams);
      if (!name || !Number.isFinite(grams)) return null;
      return { name, grams: Math.max(1, Math.round(grams)) };
    })
    .filter((item): item is FoodEstimate => Boolean(item))
    .slice(0, 10);
}

function cleanQuestions(value: unknown): ClarifyingQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label = String(record.label || "").trim();
      const options = Array.isArray(record.options)
        ? record.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 5)
        : [];
      if (!label || options.length < 2) return null;
      const id = String(record.id || `q_${index}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || `q_${index}`;
      return { id, label, options };
    })
    .filter((item): item is ClarifyingQuestion => Boolean(item))
    .slice(0, 5);
}

function fallbackQuestions(): ClarifyingQuestion[] {
  return [
    { id: "fat", label: "Cooked with which fat?", options: ["None", "Olive oil", "Butter", "Ghee"] },
    { id: "salt", label: "Salt / seasoning?", options: ["None", "Light", "Heavy"] },
    { id: "portion", label: "Portion size?", options: ["Small", "Standard", "Large"] },
  ];
}

function normalizeIdentify(raw: unknown) {
  const parsed = IdentifySchema.safeParse(raw);
  const value = parsed.success ? parsed.data : raw;
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const foods = cleanFoods(record.foods);
  const questions = cleanQuestions(record.questions);
  return {
    name: String(record.name || "Meal").trim() || "Meal",
    foods: foods.length ? foods : [{ name: "Mixed plate", grams: 250 }],
    questions: questions.length ? questions : fallbackQuestions(),
  };
}

function safeExtractJson(raw: string): unknown | null {
  try {
    return extractJson(raw);
  } catch (error) {
    console.warn("Unable to parse AI JSON response", error);
    return null;
  }
}

export const identifyMeal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => IdentifyInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const system =
      "You are a clinical nutrition vision agent. Identify each food visible in the meal photo and estimate its weight in grams. Then generate 3-4 short clarifying questions whose answers materially change the mineral content of THIS specific plate (e.g., cooking fat used, salt/seasoning, dairy added, grain type, leafy greens raw vs cooked, portion size, fortification). Each question must have 3-4 concise options. Use lowercase snake_case ids.";

    const { text } = await generateText({
      model,
      system: `${system} Return ONLY valid JSON with this shape: {"name":"short meal name","foods":[{"name":"food","grams":120}],"questions":[{"id":"snake_case","label":"question?","options":["option 1","option 2","option 3"]}]}. Do not wrap in markdown. Use plain numbers without commas.`,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Identify foods and generate clarifying questions for mineral tracking." },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    });

    return normalizeIdentify(safeExtractJson(text));
  });

export const identifyMealFromText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => IdentifyTextInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const system =
      "You are a clinical nutrition agent. The user described a meal in natural language. Identify each food and estimate its weight in grams (use sensible defaults if unspecified). Then generate 3-4 short clarifying questions whose answers materially change the mineral content (cooking fat, salt, dairy, grain choice, portion). Each question must have 3-4 concise options. Use lowercase snake_case ids.";

    const { text } = await generateText({
      model,
      system: `${system} Return ONLY valid JSON with this shape: {"name":"short meal name","foods":[{"name":"food","grams":120}],"questions":[{"id":"snake_case","label":"question?","options":["option 1","option 2","option 3"]}]}. Do not wrap in markdown.`,
      messages: [{ role: "user", content: `Meal description:\n"${data.text}"\n\nReturn identified foods + clarifying questions.` }],
    });
    return normalizeIdentify(safeExtractJson(text));
  });

const ComputeInput = z.object({
  imageDataUrl: z.string().min(20).optional(),
  name: z.string(),
  foods: z.array(z.object({ name: z.string(), grams: z.number() })).min(1),
  answers: z.array(z.object({ label: z.string(), value: z.string() })),
});

const MineralsShape = z.object({
  carbohydrates: z.number(), fiber: z.number(), protein: z.number(), fat: z.number(), saturated_fat: z.number(),
  vitamin_a: z.number(), vitamin_c: z.number(), vitamin_d: z.number(), vitamin_e: z.number(), vitamin_k: z.number(),
  thiamin: z.number(), riboflavin: z.number(), niacin: z.number(), pantothenic_acid: z.number(), vitamin_b6: z.number(),
  biotin: z.number(), folate: z.number(), vitamin_b12: z.number(),
  calcium: z.number(), phosphorus: z.number(), magnesium: z.number(), sodium: z.number(),
  potassium: z.number(), chloride: z.number(), sulfur: z.number(),
  iron: z.number(), zinc: z.number(), copper: z.number(), selenium: z.number(),
  iodine: z.number(), manganese: z.number(), chromium: z.number(), fluoride: z.number(),
  molybdenum: z.number(), cobalt: z.number(), chlorine: z.number(),
  vanadium: z.number(), nickel: z.number(),
});

const ComputeSchema = z.object({
  name: z.string(),
  foods: z.array(z.object({ name: z.string(), grams: z.number() })).min(1),
  minerals: MineralsShape,
  prepNotes: z.string(),
});

const MINERAL_KEYS = [
  "carbohydrates", "fiber", "protein", "fat", "saturated_fat",
  "vitamin_a", "vitamin_c", "vitamin_d", "vitamin_e", "vitamin_k",
  "thiamin", "riboflavin", "niacin", "pantothenic_acid", "vitamin_b6",
  "biotin", "folate", "vitamin_b12",
  "calcium", "phosphorus", "magnesium", "sodium", "potassium", "chloride", "sulfur",
  "iron", "zinc", "copper", "selenium", "iodine", "manganese", "chromium", "fluoride",
  "molybdenum", "cobalt", "chlorine", "vanadium", "nickel",
] as const;

function normalizeCompute(raw: unknown, fallback: z.infer<typeof ComputeInput>) {
  const parsed = ComputeSchema.safeParse(raw);
  const value = parsed.success ? parsed.data : raw;
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const mineralRecord = record.minerals && typeof record.minerals === "object"
    ? (record.minerals as Record<string, unknown>)
    : {};
  const minerals = MINERAL_KEYS.reduce((acc, key) => {
    const value = Number(mineralRecord[key]);
    acc[key] = Number.isFinite(value) && value > 0 ? value : 0;
    return acc;
  }, {} as Record<(typeof MINERAL_KEYS)[number], number>);

  return {
    name: String(record.name || fallback.name || "Scanned meal").trim() || "Scanned meal",
    foods: cleanFoods(record.foods).length ? cleanFoods(record.foods) : fallback.foods,
    minerals,
    prepNotes: String(record.prepNotes || "Estimated from the photo and your answers.").trim(),
  };
}

function estimateFallbackMinerals(foods: FoodEstimate[]) {
  const grams = foods.reduce((sum, food) => sum + food.grams, 0) || 250;
  const lowerNames = foods.map((food) => food.name.toLowerCase()).join(" ");
  const leafy = /spinach|amaranth|greens|kale|moringa|bok choy|leaf/.test(lowerNames);
  const dairy = /milk|paneer|cheese|yogurt|curd|tofu|ragi|sesame/.test(lowerNames);
  const legumes = /bean|lentil|dal|chickpea|pea|soy|tofu|quinoa|seed|nut/.test(lowerNames);
  const meat = /chicken|fish|beef|mutton|pork|egg|salmon|tuna/.test(lowerNames);
  const grain = /rice|bread|roti|pasta|oat|quinoa|cereal|noodle|wrap|millet/.test(lowerNames);
  const fruit = /banana|apple|orange|berry|mango|citrus|fruit|papaya|guava|kiwi/.test(lowerNames);
  return {
    // Macronutrients (g)
    carbohydrates: +(grams * (grain ? 0.45 : fruit ? 0.18 : legumes ? 0.2 : 0.08)).toFixed(1),
    fiber:         +(grams * (legumes || leafy ? 0.05 : grain ? 0.025 : 0.015)).toFixed(1),
    protein:       +(grams * (meat ? 0.22 : dairy ? 0.1 : legumes ? 0.09 : 0.04)).toFixed(1),
    fat:           +(grams * (meat ? 0.1 : dairy ? 0.06 : legumes ? 0.07 : 0.03)).toFixed(1),
    saturated_fat: +(grams * (dairy || meat ? 0.03 : 0.008)).toFixed(1),
    // Vitamins
    vitamin_a:        Math.round(grams * (leafy ? 4 : dairy ? 0.6 : 0.2)),
    vitamin_c:        +(grams * (fruit ? 0.3 : leafy ? 0.2 : 0.04)).toFixed(1),
    vitamin_d:        +(grams * (meat ? 0.04 : dairy ? 0.01 : 0.002)).toFixed(2),
    vitamin_e:        +(grams * (legumes || leafy ? 0.015 : 0.005)).toFixed(2),
    vitamin_k:        Math.round(grams * (leafy ? 1.8 : 0.15)),
    thiamin:          +(grams * (grain || legumes ? 0.004 : 0.001)).toFixed(2),
    riboflavin:       +(grams * (dairy || meat ? 0.003 : 0.001)).toFixed(2),
    niacin:           +(grams * (meat ? 0.06 : grain ? 0.02 : 0.008)).toFixed(2),
    pantothenic_acid: +(grams * 0.005).toFixed(2),
    vitamin_b6:       +(grams * (meat || legumes ? 0.004 : 0.0015)).toFixed(2),
    biotin:           +(grams * (meat || legumes ? 0.04 : 0.015)).toFixed(1),
    folate:           Math.round(grams * (leafy || legumes ? 0.6 : 0.15)),
    vitamin_b12:      +(grams * (meat ? 0.012 : dairy ? 0.005 : 0)).toFixed(2),
    // Minerals
    calcium: Math.round(grams * (dairy ? 1.6 : leafy ? 1.1 : 0.35)),
    phosphorus: Math.round(grams * (meat || legumes ? 1.5 : 0.8)),
    magnesium: Math.round(grams * (legumes || leafy ? 0.55 : 0.22)),
    sodium: Math.round(grams * 1.2),
    potassium: Math.round(grams * (leafy || legumes ? 3.8 : 2.2)),
    chloride: Math.round(grams * 1.8),
    sulfur: Math.round(grams * (meat || legumes ? 1.4 : 0.7)),
    iron: +(grams * (leafy || legumes ? 0.025 : meat ? 0.014 : 0.006)).toFixed(1),
    zinc: +(grams * (meat || legumes ? 0.018 : 0.006)).toFixed(1),
    copper: +(grams * (legumes ? 0.004 : 0.0015)).toFixed(1),
    selenium: Math.round(grams * (meat ? 0.35 : 0.12)),
    iodine: Math.round(grams * (meat || dairy ? 0.45 : 0.12)),
    manganese: +(grams * (legumes || leafy ? 0.01 : 0.003)).toFixed(1),
    chromium: Math.round(grams * 0.08),
    fluoride: +(grams * 0.002).toFixed(1),
    molybdenum: Math.round(grams * (legumes ? 0.5 : 0.16)),
    cobalt: +(grams * (meat || dairy ? 0.012 : 0.003)).toFixed(1),
    chlorine: Math.round(grams * 1.8),
    vanadium: Math.round(grams * 0.08),
    nickel: Math.round(grams * (legumes ? 0.4 : 0.16)),
  };
}

function fallbackCompute(data: z.infer<typeof ComputeInput>) {
  return {
    name: data.name || "Scanned meal",
    foods: data.foods,
    minerals: estimateFallbackMinerals(data.foods),
    prepNotes: "Estimated from the identified foods when the AI response needed normalization.",
  };
}

export const computeMinerals = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ComputeInput.parse(data))
  .handler(async ({ data }) => {
    // ---------- Primary path: USDA FoodData Central ----------
    if (process.env.USDA_API_KEY) {
      const adj = deriveAnswerAdjustments(data.answers);
      const totals = emptyMinerals();
      const matched: string[] = [];
      const unmatched: string[] = [];

      await Promise.all(
        data.foods.map(async (food) => {
          const profile = await lookupUsdaPer100g(food.name);
          if (!profile) { unmatched.push(food.name); return; }
          matched.push(food.name);
          const grams = food.grams * adj.portionMult;
          for (const k of MINERALS) {
            const per100 = profile[k];
            if (per100 === undefined) continue;
            totals[k] += (per100 / 100) * grams;
          }
        }),
      );

      if (matched.length > 0) {
        // Apply prep adjustments
        totals.fat += adj.addedFatG;
        totals.saturated_fat += adj.addedSatG;
        totals.sodium += adj.addedSodiumMg;
        // Zero out rare traces not reliably present in USDA SR.
        for (const k of HARDCODED_ZERO) totals[k] = 0;
        // Round
        const rounded = {} as Record<Mineral, number>;
        for (const k of MINERALS) rounded[k] = +totals[k].toFixed(2);

        const parts = [
          `Matched ${matched.length}/${data.foods.length} foods in USDA FoodData Central.`,
          adj.portionMult !== 1 ? `Portion ${(adj.portionMult * 100).toFixed(0)}%.` : "",
          adj.addedFatG ? `+${adj.addedFatG.toFixed(0)}g cooking fat.` : "",
          adj.addedSodiumMg ? `+${adj.addedSodiumMg}mg added salt.` : "",
          unmatched.length ? `Unmatched: ${unmatched.join(", ")}.` : "",
        ].filter(Boolean).join(" ");

        return {
          name: data.name || "Scanned meal",
          foods: data.foods,
          minerals: rounded,
          prepNotes: parts || "Calculated from USDA FoodData Central.",
        };
      }
      // else: no USDA matches, fall through to Gemini below.
    }

    // ---------- Fallback path: Gemini estimation ----------
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const system =
      "You are a clinical nutrition agent. Given identified foods (with gram estimates) and the user's clarifying answers, compute realistic TOTAL nutrients for the whole plate. Return values in GRAMS for: carbohydrates, fiber, protein, fat, saturated_fat. Return values in MILLIGRAMS for: vitamin_c, vitamin_e, thiamin, riboflavin, niacin, pantothenic_acid, vitamin_b6, calcium, phosphorus, magnesium, sodium, potassium, chloride, sulfur, iron, zinc, copper, manganese, fluoride, chlorine. Return values in MICROGRAMS for: vitamin_a, vitamin_d, vitamin_k, biotin, folate, vitamin_b12, selenium, iodine, chromium, molybdenum, cobalt, vanadium, nickel. Apply user clarifications (fat, salt, additions, portion) to adjust estimates. Use 0 for nutrients that are negligible. Always return numbers — never null.";

    const foodsList = data.foods.map((f) => `- ${f.name} (~${f.grams}g)`).join("\n");
    const answersList = data.answers.length
      ? data.answers.map((a) => `- ${a.label}: ${a.value}`).join("\n")
      : "(no clarifications)";

    const userText = `Plate: ${data.name}\n\nFoods:\n${foodsList}\n\nUser clarifications:\n${answersList}\n\nReturn totals and a one-sentence prep note summarizing the answers.`;

    const content: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [{ type: "text", text: userText }];
    if (data.imageDataUrl) content.push({ type: "image", image: data.imageDataUrl });

    const { text } = await generateText({
      model,
      system: `${system} Return ONLY valid JSON with this shape: {"name":"meal name","foods":[{"name":"food","grams":120}],"minerals":{"carbohydrates":0,"fiber":0,"protein":0,"fat":0,"saturated_fat":0,"vitamin_a":0,"vitamin_c":0,"vitamin_d":0,"vitamin_e":0,"vitamin_k":0,"thiamin":0,"riboflavin":0,"niacin":0,"pantothenic_acid":0,"vitamin_b6":0,"biotin":0,"folate":0,"vitamin_b12":0,"calcium":0,"phosphorus":0,"magnesium":0,"sodium":0,"potassium":0,"chloride":0,"sulfur":0,"iron":0,"zinc":0,"copper":0,"selenium":0,"iodine":0,"manganese":0,"chromium":0,"fluoride":0,"molybdenum":0,"cobalt":0,"chlorine":0,"vanadium":0,"nickel":0},"prepNotes":"one sentence"}. Do not wrap in markdown. Use plain numbers without commas and include every nutrient key.`,
      messages: [{ role: "user", content }],
    });

    const json = safeExtractJson(text);
    return json ? normalizeCompute(json, data) : fallbackCompute(data);
  });