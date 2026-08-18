import type { Mineral } from "./nutrition";

export const BODY_REGIONS = [
  "brain", "eyes", "thyroid", "heart", "blood", "bones", "teeth",
  "muscles", "nerves", "gut", "immune", "skin",
] as const;
export type BodyRegion = (typeof BODY_REGIONS)[number];

export const REGION_META: Record<BodyRegion, { label: string; blurb: string }> = {
  brain:    { label: "Brain",           blurb: "Focus, mood, memory." },
  eyes:     { label: "Eyes",            blurb: "Night vision & retinal health." },
  thyroid:  { label: "Thyroid",         blurb: "Metabolism & energy regulation." },
  heart:    { label: "Heart",           blurb: "Rhythm, blood pressure, endurance." },
  blood:    { label: "Blood",           blurb: "Oxygen transport & hemoglobin." },
  bones:    { label: "Bones",           blurb: "Density, strength, fracture risk." },
  teeth:    { label: "Teeth",           blurb: "Enamel & jaw structure." },
  muscles:  { label: "Muscles",         blurb: "Contraction, recovery, cramps." },
  nerves:   { label: "Nerves",          blurb: "Signal speed & reflexes." },
  gut:      { label: "Gut",             blurb: "Digestion & nutrient absorption." },
  immune:   { label: "Immune system",   blurb: "Defense against illness." },
  skin:     { label: "Skin, hair, nails", blurb: "Healing & barrier integrity." },
};

// Mineral → body regions it primarily supports.
export const MINERAL_TO_REGIONS: Partial<Record<Mineral, BodyRegion[]>> = {
  calcium:     ["bones", "teeth", "heart", "muscles", "nerves"],
  iron:        ["blood", "brain", "muscles", "immune"],
  magnesium:   ["muscles", "nerves", "heart", "bones"],
  potassium:   ["heart", "muscles", "nerves"],
  sodium:      ["nerves", "muscles"],
  zinc:        ["immune", "skin", "brain"],
  iodine:      ["thyroid", "brain"],
  selenium:    ["thyroid", "immune"],
  copper:      ["nerves", "blood", "immune"],
  phosphorus:  ["bones", "teeth"],
  chloride:    ["gut", "muscles"],
  sulfur:      ["skin", "muscles"],
  chromium:    ["muscles"],
  manganese:   ["bones", "brain"],
  fluoride:    ["teeth", "bones"],
  molybdenum:  ["gut"],
  cobalt:      ["blood", "nerves"],
  chlorine:    ["gut"],
  vanadium:    ["bones"],
  nickel:      ["blood"],
  vitamin_a:   ["eyes", "skin", "immune"],
  vitamin_c:   ["skin", "immune", "gut"],
  vitamin_d:   ["bones", "immune", "muscles"],
  vitamin_e:   ["skin", "immune"],
  vitamin_k:   ["blood", "bones"],
  thiamin:     ["nerves", "heart"],
  riboflavin:  ["skin", "eyes"],
  niacin:      ["skin", "nerves"],
  pantothenic_acid: ["skin", "nerves"],
  vitamin_b6:  ["brain", "immune"],
  biotin:      ["skin"],
  folate:      ["blood", "brain"],
  vitamin_b12: ["nerves", "blood", "brain"],
  protein:     ["muscles", "skin"],
  fiber:       ["gut"],
  fat:         ["brain", "skin"],
  carbohydrates: ["brain", "muscles"],
  saturated_fat: ["heart"],
};

export function regionsForMineral(m: Mineral): BodyRegion[] {
  return MINERAL_TO_REGIONS[m] ?? [];
}

export function mineralsForRegion(r: BodyRegion): Mineral[] {
  const out: Mineral[] = [];
  for (const key in MINERAL_TO_REGIONS) {
    if (MINERAL_TO_REGIONS[key as Mineral]?.includes(r)) out.push(key as Mineral);
  }
  return out;
}