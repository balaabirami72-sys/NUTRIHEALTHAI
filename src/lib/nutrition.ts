import { useEffect, useState } from "react";

export type Sex = "male" | "female";
export type Gender = "cis" | "trans";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
export const MEAL_TYPE_META: Record<MealType, { label: string; emoji: string; hours: [number, number] }> = {
  breakfast: { label: "Breakfast", emoji: "🍳", hours: [4, 11] },
  lunch:     { label: "Lunch",     emoji: "🥗", hours: [11, 15] },
  snack:     { label: "Snack",     emoji: "🍎", hours: [15, 18] },
  dinner:    { label: "Dinner",    emoji: "🍽️", hours: [18, 24] },
};
export function mealTypeFromDate(d: Date): MealType {
  const h = d.getHours();
  if (h >= 4 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 18) return "snack";
  return "dinner";
}

export const ACTIVITY_META: Record<ActivityLevel, { label: string; desc: string; mult: number }> = {
  sedentary: { label: "Sedentary",   desc: "Mostly sitting",          mult: 1.00 },
  light:     { label: "Light",       desc: "Walks, light chores",     mult: 1.05 },
  moderate:  { label: "Moderate",    desc: "3–5 workouts / week",     mult: 1.10 },
  active:    { label: "Active",      desc: "Daily training",          mult: 1.20 },
  very:      { label: "Very active", desc: "Athlete / hard labor",    mult: 1.30 },
};

export type Profile = {
  name: string;
  age: number;
  sex: Sex;
  gender: Gender;
  hrt: boolean;
  menstruating: boolean;
  weightKg: number;
  activity: ActivityLevel;
  heightCm?: number;
  dietaryGoal?: "lose" | "maintain" | "gain" | "athletic";
  /** Home state (code from state-cuisine.ts) for regional food recommendations. */
  state?: string;
  complete?: boolean;
};

export const MINERALS = [
  // Macronutrients
  "carbohydrates", "fiber", "protein", "fat", "saturated_fat",
  // Vitamins
  "vitamin_a", "vitamin_c", "vitamin_d", "vitamin_e", "vitamin_k",
  "thiamin", "riboflavin", "niacin", "pantothenic_acid", "vitamin_b6",
  "biotin", "folate", "vitamin_b12",
  // Macrominerals
  "calcium", "phosphorus", "magnesium", "sodium", "potassium", "chloride", "sulfur",
  // Trace minerals
  "iron", "zinc", "copper", "selenium", "iodine", "manganese", "chromium",
  "fluoride", "molybdenum", "cobalt", "chlorine", "vanadium", "nickel",
] as const;
export type Mineral = (typeof MINERALS)[number];

export const MINERAL_META: Record<Mineral, { label: string; unit: string; color: string; group: "macronutrient" | "vitamin" | "macro" | "trace" }> = {
  carbohydrates:   { label: "Carbs",          unit: "g",  color: "oklch(0.78 0.16 70)",  group: "macronutrient" },
  fiber:           { label: "Fiber",          unit: "g",  color: "oklch(0.75 0.15 140)", group: "macronutrient" },
  protein:         { label: "Protein",        unit: "g",  color: "oklch(0.74 0.17 25)",  group: "macronutrient" },
  fat:             { label: "Fat",            unit: "g",  color: "oklch(0.78 0.15 55)",  group: "macronutrient" },
  saturated_fat:   { label: "Sat. Fat",       unit: "g",  color: "oklch(0.72 0.16 35)",  group: "macronutrient" },
  vitamin_a:       { label: "Vitamin A",      unit: "µg", color: "oklch(0.8 0.16 75)",   group: "vitamin" },
  vitamin_c:       { label: "Vitamin C",      unit: "mg", color: "oklch(0.82 0.17 100)", group: "vitamin" },
  vitamin_d:       { label: "Vitamin D",      unit: "µg", color: "oklch(0.82 0.15 90)",  group: "vitamin" },
  vitamin_e:       { label: "Vitamin E",      unit: "mg", color: "oklch(0.78 0.14 120)", group: "vitamin" },
  vitamin_k:       { label: "Vitamin K",      unit: "µg", color: "oklch(0.74 0.15 160)", group: "vitamin" },
  thiamin:         { label: "Thiamin (B1)",   unit: "mg", color: "oklch(0.74 0.14 200)", group: "vitamin" },
  riboflavin:      { label: "Riboflavin (B2)",unit: "mg", color: "oklch(0.76 0.15 220)", group: "vitamin" },
  niacin:          { label: "Niacin (B3)",    unit: "mg", color: "oklch(0.75 0.15 240)", group: "vitamin" },
  pantothenic_acid:{ label: "Pant. Acid (B5)",unit: "mg", color: "oklch(0.74 0.15 260)", group: "vitamin" },
  vitamin_b6:      { label: "Vitamin B6",     unit: "mg", color: "oklch(0.73 0.16 280)", group: "vitamin" },
  biotin:          { label: "Biotin (B7)",    unit: "µg", color: "oklch(0.72 0.16 300)", group: "vitamin" },
  folate:          { label: "Folate (B9)",    unit: "µg", color: "oklch(0.72 0.17 320)", group: "vitamin" },
  vitamin_b12:     { label: "Vitamin B12",    unit: "µg", color: "oklch(0.7 0.17 340)",  group: "vitamin" },
  calcium:    { label: "Calcium",    unit: "mg", color: "oklch(0.78 0.17 170)", group: "macro" },
  phosphorus: { label: "Phosphorus", unit: "mg", color: "oklch(0.75 0.16 200)", group: "macro" },
  magnesium:  { label: "Magnesium",  unit: "mg", color: "oklch(0.72 0.17 150)", group: "macro" },
  sodium:     { label: "Sodium",     unit: "mg", color: "oklch(0.78 0.15 80)",  group: "macro" },
  potassium:  { label: "Potassium",  unit: "mg", color: "oklch(0.75 0.16 230)", group: "macro" },
  chloride:   { label: "Chloride",   unit: "mg", color: "oklch(0.74 0.15 110)", group: "macro" },
  sulfur:     { label: "Sulfur",     unit: "mg", color: "oklch(0.82 0.15 95)",  group: "macro" },
  iron:       { label: "Iron",       unit: "mg", color: "oklch(0.72 0.17 30)",  group: "trace" },
  zinc:       { label: "Zinc",       unit: "mg", color: "oklch(0.75 0.13 260)", group: "trace" },
  copper:     { label: "Copper",     unit: "mg", color: "oklch(0.74 0.16 50)",  group: "trace" },
  selenium:   { label: "Selenium",   unit: "µg", color: "oklch(0.74 0.15 300)", group: "trace" },
  iodine:     { label: "Iodine",     unit: "µg", color: "oklch(0.7 0.18 320)",  group: "trace" },
  manganese:  { label: "Manganese",  unit: "mg", color: "oklch(0.7 0.15 350)",  group: "trace" },
  chromium:   { label: "Chromium",   unit: "µg", color: "oklch(0.78 0.12 180)", group: "trace" },
  fluoride:   { label: "Fluoride",   unit: "mg", color: "oklch(0.78 0.13 220)", group: "trace" },
  molybdenum: { label: "Molybdenum", unit: "µg", color: "oklch(0.72 0.14 280)", group: "trace" },
  cobalt:     { label: "Cobalt",     unit: "µg", color: "oklch(0.7 0.17 250)",  group: "trace" },
  chlorine:   { label: "Chlorine",   unit: "mg", color: "oklch(0.78 0.13 130)", group: "trace" },
  vanadium:   { label: "Vanadium",   unit: "µg", color: "oklch(0.7 0.14 60)",   group: "trace" },
  nickel:     { label: "Nickel",     unit: "µg", color: "oklch(0.72 0.1 240)",  group: "trace" },
};

export function computeTargets(p: Profile): Record<Mineral, number> {
  const male = p.sex === "male";
  const child = p.age < 14;
  const teen = p.age >= 14 && p.age < 19;
  const senior = p.age > 60;
  const actMult = ACTIVITY_META[p.activity]?.mult ?? 1;
  // Weight scaling factor anchored at 70kg, clamped to avoid extremes.
  const wScale = Math.max(0.75, Math.min(1.35, (p.weightKg || 70) / 70));

  // Calcium (mg)
  let calcium = 1000;
  if (child) calcium = p.age < 9 ? 800 : 1300;
  else if (teen) calcium = 1300;
  else if (senior) calcium = 1200;

  // Iron (mg)
  let iron = male ? 8 : 8;
  const cisFemaleMenstruating = p.sex === "female" && p.gender === "cis" && p.menstruating;
  const transMascMenstruating = p.sex === "female" && p.gender === "trans" && p.menstruating && !p.hrt;
  if (cisFemaleMenstruating || transMascMenstruating) iron = 18;
  if (teen && !male) iron = 15;
  if (child) iron = 10;

  // Magnesium (mg) — scales with body weight & activity (electrolyte loss).
  let magnesium = male ? 400 : 320;
  if (teen) magnesium = male ? 410 : 360;
  if (child) magnesium = 240;
  if (p.sex === "female" && p.gender === "trans" && p.hrt) magnesium = 360;
  if (p.sex === "male" && p.gender === "trans" && p.hrt) magnesium = 340;
  magnesium = Math.round(magnesium * wScale * actMult);

  // Potassium (mg) — strongly affected by activity (sweat losses).
  let potassium = male ? 3400 : 2600;
  if (teen) potassium = male ? 3000 : 2300;
  if (child) potassium = 2000;
  potassium = Math.round(potassium * wScale * actMult);

  // Zinc (mg)
  let zinc = male ? 11 : 8;
  if (teen) zinc = male ? 11 : 9;
  if (child) zinc = 5;

  // Phosphorus (mg)
  let phosphorus = 700;
  if (teen) phosphorus = 1250;
  if (child) phosphorus = 1000;

  // Sodium (mg, AI) — replace losses from sweat.
  let sodium = 1500;
  if (child) sodium = 1200;
  if (senior) sodium = 1300;
  sodium = Math.round(sodium * actMult);

  // Chloride (mg, AI) — mirrors sodium losses.
  let chloride = 2300;
  if (child) chloride = 1900;
  if (senior) chloride = 2000;
  chloride = Math.round(chloride * actMult);

  // Sulfur (mg, estimated AI — no formal RDA)
  const sulfur = male ? 900 : 800;

  // Copper (mg)
  let copper = 0.9;
  if (teen) copper = 0.89;
  if (child) copper = 0.44;

  // Selenium (µg)
  let selenium = 55;
  if (child) selenium = 30;

  // Iodine (µg)
  let iodine = 150;
  if (child) iodine = 90;

  // Manganese (mg, AI)
  let manganese = male ? 2.3 : 1.8;
  if (teen) manganese = male ? 2.2 : 1.6;
  if (child) manganese = 1.5;

  // Chromium (µg, AI)
  let chromium = male ? 35 : 25;
  if (senior) chromium = male ? 30 : 20;
  if (teen) chromium = male ? 35 : 24;
  if (child) chromium = 15;

  // Fluoride (mg, AI)
  let fluoride = male ? 4 : 3;
  if (child) fluoride = 1.5;

  // Molybdenum (µg)
  let molybdenum = 45;
  if (teen) molybdenum = 43;
  if (child) molybdenum = 22;

  // Cobalt (µg) — via B12 equivalent
  const cobalt = 2.4;

  // Chlorine (mg) — mirrors chloride intake (paired)
  const chlorine = chloride;

  // Vanadium (µg, estimated)
  const vanadium = 18;

  // Nickel (µg, estimated)
  const nickel = 70;

  // ---------- Macronutrients ----------
  // Carbohydrates (g): scale with activity for endurance fueling.
  let carbohydrates = Math.round(130 * actMult * wScale);
  if (child) carbohydrates = 130;

  // Dietary fiber (g): 14g per 1000 kcal heuristic, capped.
  let fiber = male ? 38 : 25;
  if (teen) fiber = male ? 38 : 26;
  if (child) fiber = 25;
  if (senior) fiber = male ? 30 : 21;
  fiber = Math.round(fiber * Math.min(1.2, actMult));

  // Protein (g): 0.8 g/kg baseline; activity raises up to ~1.4 g/kg.
  const proteinPerKg = 0.8 + (actMult - 1) * 2; // 0.8 → ~1.4 at very active
  let protein = Math.round((p.weightKg || 70) * proteinPerKg);
  if (child) protein = Math.max(protein, 19);

  // Total fat (g): ~30% of energy. Use baseline 70g (male) / 60g (female).
  let fat = male ? 70 : 60;
  if (teen) fat = male ? 75 : 65;
  if (child) fat = 50;
  fat = Math.round(fat * actMult * wScale);

  // Saturated fat (g): cap (<10% energy). Treated as upper target.
  let saturated_fat = male ? 22 : 18;
  if (child) saturated_fat = 15;
  saturated_fat = Math.round(saturated_fat * wScale);

  // ---------- Vitamins ----------
  let vitamin_a = male ? 900 : 700; // µg RAE
  if (teen) vitamin_a = male ? 900 : 700;
  if (child) vitamin_a = p.age < 9 ? 400 : 600;

  let vitamin_c = male ? 90 : 75; // mg
  if (teen) vitamin_c = male ? 75 : 65;
  if (child) vitamin_c = 25;

  let vitamin_d = 15; // µg
  if (p.age >= 70) vitamin_d = 20;
  if (child) vitamin_d = 15;

  let vitamin_e = 15; // mg
  if (child) vitamin_e = p.age < 9 ? 7 : 11;

  let vitamin_k = male ? 120 : 90; // µg
  if (teen) vitamin_k = male ? 75 : 75;
  if (child) vitamin_k = 55;

  let thiamin = male ? 1.2 : 1.1; // mg
  if (teen) thiamin = male ? 1.2 : 1.0;
  if (child) thiamin = 0.6;

  let riboflavin = male ? 1.3 : 1.1; // mg
  if (teen) riboflavin = male ? 1.3 : 1.0;
  if (child) riboflavin = 0.6;

  let niacin = male ? 16 : 14; // mg NE
  if (teen) niacin = male ? 16 : 14;
  if (child) niacin = 8;

  const pantothenic_acid = child ? 3 : 5; // mg AI

  let vitamin_b6 = 1.3; // mg
  if (senior) vitamin_b6 = male ? 1.7 : 1.5;
  if (teen) vitamin_b6 = male ? 1.3 : 1.2;
  if (child) vitamin_b6 = 0.6;

  let biotin = 30; // µg AI
  if (teen) biotin = 25;
  if (child) biotin = 12;

  let folate = 400; // µg DFE
  if (teen) folate = 400;
  if (child) folate = p.age < 9 ? 200 : 300;

  const vitamin_b12 = child ? (p.age < 9 ? 1.2 : 1.8) : 2.4; // µg

  return {
    carbohydrates, fiber, protein, fat, saturated_fat,
    vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k,
    thiamin, riboflavin, niacin, pantothenic_acid, vitamin_b6,
    biotin, folate, vitamin_b12,
    calcium, phosphorus, magnesium, sodium, potassium, chloride, sulfur,
    iron, zinc, copper, selenium, iodine, manganese, chromium,
    fluoride, molybdenum, cobalt, chlorine, vanadium, nickel,
  };
}

export function emptyMinerals(): Record<Mineral, number> {
  return MINERALS.reduce((acc, m) => { acc[m] = 0; return acc; }, {} as Record<Mineral, number>);
}

export const DEFAULT_PROFILE: Profile = {
  name: "Alex Rivera",
  age: 29,
  sex: "female",
  gender: "cis",
  hrt: false,
  menstruating: true,
  weightKg: 65,
  activity: "moderate",
  heightCm: 168,
  dietaryGoal: "maintain",
  complete: false,
};

export type Meal = {
  id: string;
  name: string;
  loggedAt: string; // ISO
  foods: { name: string; grams: number }[];
  minerals: Partial<Record<Mineral, number>>;
  prepNotes: string;
  mealType: MealType;
};

const PROFILE_KEY = "nutri-health-ai.profile";
const MEALS_KEY = "nutri-health-ai.meals";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("nutri-health-ai:update", { detail: { key } }));
}

export function useProfile(): [Profile, (p: Profile) => void] {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  useEffect(() => {
    setProfile(read(PROFILE_KEY, DEFAULT_PROFILE));
    const h = () => setProfile(read(PROFILE_KEY, DEFAULT_PROFILE));
    window.addEventListener("nutri-health-ai:update", h);
    return () => window.removeEventListener("nutri-health-ai:update", h);
  }, []);
  const save = (p: Profile) => {
    write(PROFILE_KEY, p);
    setProfile(p);
  };
  return [profile, save];
}

export function useMeals(): [Meal[], (m: Meal) => void, (id: string) => void] {
  const [meals, setMeals] = useState<Meal[]>([]);
  useEffect(() => {
    const initial = read<Meal[]>(MEALS_KEY, []);
    if (initial.length === 0) {
      const seed = seedMeals();
      write(MEALS_KEY, seed);
      setMeals(seed);
    } else {
      setMeals(initial);
    }
    const h = () => setMeals(read<Meal[]>(MEALS_KEY, []));
    window.addEventListener("nutri-health-ai:update", h);
    return () => window.removeEventListener("nutri-health-ai:update", h);
  }, []);
  const add = (m: Meal) => {
    const next = [m, ...meals];
    write(MEALS_KEY, next);
    setMeals(next);
  };
  const remove = (id: string) => {
    const next = meals.filter((m) => m.id !== id);
    write(MEALS_KEY, next);
    setMeals(next);
  };
  return [meals, add, remove];
}

function seedMeals(): Meal[] {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const make = (daysAgo: number, name: string, mins: Partial<Record<Mineral, number>>, foods: { name: string; grams: number }[]): Meal => ({
    id: `seed-${daysAgo}-${name}`,
    name,
    loggedAt: new Date(now.getTime() - daysAgo * dayMs - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
    foods,
    minerals: mins,
    prepNotes: "Seeded sample meal",
    mealType: "lunch",
  });
  const list = [
    make(0, "Spinach & Chicken Bowl", { calcium: 120, iron: 4.2, magnesium: 95, potassium: 780, zinc: 1.8 }, [{ name: "Spinach", grams: 150 }, { name: "Grilled Chicken", grams: 100 }]),
    make(0, "Greek Yogurt Parfait", { calcium: 310, iron: 0.4, magnesium: 38, potassium: 410, zinc: 1.1 }, [{ name: "Greek Yogurt", grams: 200 }, { name: "Berries", grams: 80 }]),
    make(1, "Lentil Curry & Ragi Roti", { calcium: 220, iron: 6.5, magnesium: 110, potassium: 690, zinc: 2.4 }, [{ name: "Lentils", grams: 180 }, { name: "Ragi Roti", grams: 90 }]),
    make(1, "Paneer Tikka Wrap", { calcium: 410, iron: 2.1, magnesium: 62, potassium: 520, zinc: 2.0 }, [{ name: "Paneer", grams: 120 }, { name: "Whole-wheat Wrap", grams: 80 }]),
    make(2, "Salmon & Sweet Potato", { calcium: 60, iron: 1.6, magnesium: 88, potassium: 920, zinc: 1.4 }, [{ name: "Salmon", grams: 140 }, { name: "Sweet Potato", grams: 200 }]),
    make(3, "Oatmeal w/ Almonds", { calcium: 180, iron: 2.4, magnesium: 130, potassium: 380, zinc: 1.9 }, [{ name: "Oats", grams: 60 }, { name: "Almonds", grams: 30 }]),
    make(3, "Tofu Stir Fry", { calcium: 280, iron: 3.1, magnesium: 75, potassium: 600, zinc: 1.7 }, [{ name: "Tofu", grams: 150 }, { name: "Bok Choy", grams: 120 }]),
    make(4, "Chicken Caesar Salad", { calcium: 95, iron: 1.2, magnesium: 42, potassium: 410, zinc: 1.5 }, [{ name: "Romaine", grams: 100 }, { name: "Chicken", grams: 120 }]),
    make(5, "Quinoa Buddha Bowl", { calcium: 140, iron: 3.8, magnesium: 120, potassium: 720, zinc: 2.2 }, [{ name: "Quinoa", grams: 150 }, { name: "Chickpeas", grams: 100 }]),
    make(6, "Pasta Marinara", { calcium: 70, iron: 1.4, magnesium: 55, potassium: 480, zinc: 1.2 }, [{ name: "Pasta", grams: 180 }, { name: "Tomato Sauce", grams: 120 }]),
    make(6, "Banana & Peanut Butter Toast", { calcium: 55, iron: 1.0, magnesium: 60, potassium: 520, zinc: 1.0 }, [{ name: "Banana", grams: 120 }, { name: "Peanut Butter", grams: 32 }]),
  ];
  return list.map((m) => ({ ...m, mealType: mealTypeFromDate(new Date(m.loggedAt)) }));
}

export function sumDay(meals: Meal[], date: Date): Record<Mineral, number> {
  const start = new Date(date); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const totals = emptyMinerals();
  for (const m of meals) {
    const t = new Date(m.loggedAt);
    if (t >= start && t < end) {
      for (const k of MINERALS) totals[k] += m.minerals[k] ?? 0;
    }
  }
  return totals;
}

export const SUGGESTIONS: Record<Mineral, string[]> = {
  carbohydrates: ["Oats & whole grains", "Brown rice & millets", "Sweet potato", "Fruits (banana, apple)"],
  fiber:         ["Lentils & beans", "Chia & flax seeds", "Berries & pears", "Whole-grain bread"],
  protein:       ["Eggs & chicken", "Paneer / tofu", "Greek yogurt", "Lentils & chickpeas"],
  fat:           ["Avocado", "Olive oil & nuts", "Fatty fish (salmon)", "Seeds (pumpkin, chia)"],
  saturated_fat: ["Limit butter & ghee", "Trim red meat", "Swap to olive oil", "Skim dairy"],
  vitamin_a:     ["Carrots & sweet potato", "Spinach & kale", "Eggs & liver", "Mango & papaya"],
  vitamin_c:     ["Amla / guava", "Citrus fruits", "Bell peppers", "Strawberries & kiwi"],
  vitamin_d:     ["Sunlight 15-20 min", "Fatty fish (salmon)", "Egg yolks", "Fortified milk"],
  vitamin_e:     ["Almonds & sunflower seeds", "Avocado", "Spinach", "Wheat germ oil"],
  vitamin_k:     ["Kale & spinach", "Broccoli", "Natto / fermented soy", "Parsley & herbs"],
  thiamin:       ["Whole grains & oats", "Pork & legumes", "Sunflower seeds", "Fortified cereals"],
  riboflavin:    ["Dairy & eggs", "Almonds", "Mushrooms", "Lean meats"],
  niacin:        ["Chicken & turkey", "Tuna & salmon", "Peanuts", "Whole grains"],
  pantothenic_acid: ["Eggs & avocado", "Mushrooms", "Sweet potato", "Lentils"],
  vitamin_b6:    ["Chickpeas", "Salmon & tuna", "Banana", "Potatoes"],
  biotin:        ["Eggs (cooked)", "Almonds & walnuts", "Sweet potato", "Salmon"],
  folate:        ["Leafy greens (spinach)", "Lentils & beans", "Asparagus", "Fortified grains"],
  vitamin_b12:   ["Eggs & dairy", "Fish & shellfish", "Fortified cereals", "Nutritional yeast"],
  calcium:    ["Ragi (finger millet)", "Paneer & sesame seeds", "Fortified plant milk", "Yogurt or kefir"],
  phosphorus: ["Dairy & eggs", "Salmon & sardines", "Lentils & beans", "Pumpkin seeds"],
  magnesium:  ["Dark chocolate (70%+)", "Almonds & cashews", "Black beans", "Avocado"],
  sodium:     ["A pinch of iodized salt", "Olives & pickles", "Miso or broth", "Feta cheese"],
  potassium:  ["Bananas & oranges", "Sweet potato (skin on)", "White beans", "Coconut water"],
  chloride:   ["Sea salt & table salt", "Seaweed (nori, kelp)", "Olives", "Tomatoes & celery"],
  sulfur:     ["Eggs & poultry", "Garlic & onions", "Cruciferous veg (broccoli, kale)", "Lentils"],
  iron:       ["Amaranth & spinach", "Pumpkin seeds", "Lentils & chickpeas", "Pair with citrus to boost absorption"],
  zinc:       ["Pumpkin & hemp seeds", "Lentils & chickpeas", "Cashews", "Oysters or fortified cereal"],
  copper:     ["Cashews & almonds", "Shellfish & oysters", "Mushrooms (shiitake)", "Dark chocolate"],
  selenium:   ["Brazil nuts (1-2/day)", "Tuna & sardines", "Eggs", "Brown rice"],
  iodine:     ["Iodized salt", "Seaweed (nori, kelp)", "Dairy & eggs", "Cod or shrimp"],
  manganese:  ["Whole grains & oats", "Pineapple", "Hazelnuts & pecans", "Brown rice"],
  chromium:   ["Broccoli", "Whole-grain bread", "Grape juice", "Barley"],
  fluoride:   ["Fluoridated tap water", "Brewed black tea", "Sardines with bones", "Shrimp"],
  molybdenum: ["Lentils & black beans", "Peas", "Whole grains", "Liver"],
  cobalt:     ["Vitamin B12 foods: eggs", "Dairy & yogurt", "Fish & shellfish", "Fortified cereals"],
  chlorine:   ["Sea salt", "Seaweed", "Olives", "Rye bread"],
  vanadium:   ["Mushrooms", "Shellfish", "Black pepper & dill", "Parsley"],
  nickel:     ["Cocoa & dark chocolate", "Nuts (cashews, hazelnuts)", "Soybeans & lentils", "Oats"],
};