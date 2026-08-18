import type { Mineral } from "@/lib/nutrition";

export type CatalogItem = {
  name: string;
  region: string;
  minerals: Partial<Record<Mineral, string>>; // short "rich in" tag
  note: string;
};

export type CatalogCategory = {
  slug: string;
  label: string;
  emoji: string;
  tagline: string;
  items: CatalogItem[];
};

export const INDIAN_CATALOG: CatalogCategory[] = [
  {
    slug: "breakfast",
    label: "Traditional Breakfast",
    emoji: "🥞",
    tagline: "Idli, poha, upma & regional morning staples",
    items: [
      { name: "Idli with Sambar", region: "South India", minerals: { protein: "high", iron: "medium" }, note: "Fermented rice-lentil cakes with lentil-vegetable stew" },
      { name: "Poha", region: "Maharashtra", minerals: { carbohydrates: "high", iron: "medium" }, note: "Flattened rice with mustard, curry leaves, peanuts" },
      { name: "Upma", region: "South India", minerals: { fiber: "medium", magnesium: "medium" }, note: "Semolina cooked with vegetables and tempering" },
      { name: "Aloo Paratha", region: "Punjab", minerals: { carbohydrates: "high", potassium: "medium" }, note: "Whole-wheat flatbread stuffed with spiced potato" },
      { name: "Masala Dosa", region: "Karnataka", minerals: { protein: "medium", fiber: "medium" }, note: "Crisp fermented crepe with spiced potato filling" },
      { name: "Ragi Malt", region: "Karnataka", minerals: { calcium: "high", iron: "high" }, note: "Finger millet porridge with jaggery" },
      { name: "Thepla", region: "Gujarat", minerals: { iron: "medium", fiber: "medium" }, note: "Methi-spiced whole-wheat flatbread" },
      { name: "Puttu with Kadala", region: "Kerala", minerals: { protein: "high", iron: "high" }, note: "Steamed rice cake with black chickpea curry" },
    ],
  },
  {
    slug: "dals",
    label: "Lentils & Dals",
    emoji: "🥣",
    tagline: "Protein-rich pulses across the subcontinent",
    items: [
      { name: "Dal Tadka", region: "North India", minerals: { protein: "high", folate: "high" }, note: "Yellow moong/toor dal with cumin-garlic tempering" },
      { name: "Rajma", region: "Punjab / Kashmir", minerals: { iron: "high", protein: "high", fiber: "high" }, note: "Kidney beans in tomato-onion gravy" },
      { name: "Chana Masala", region: "North India", minerals: { protein: "high", iron: "high" }, note: "Chickpeas simmered in anardana-spice masala" },
      { name: "Sambar", region: "Tamil Nadu", minerals: { protein: "medium", vitamin_c: "medium" }, note: "Toor dal with tamarind and mixed vegetables" },
      { name: "Pesarattu Batter", region: "Andhra Pradesh", minerals: { protein: "high", magnesium: "medium" }, note: "Whole green-moong crepe" },
      { name: "Kadhi Pakora", region: "Rajasthan", minerals: { calcium: "high", protein: "medium" }, note: "Besan yogurt curry with gram-flour fritters" },
      { name: "Lobia Curry", region: "Uttar Pradesh", minerals: { iron: "high", folate: "high" }, note: "Black-eyed peas with tomato masala" },
    ],
  },
  {
    slug: "curries",
    label: "Regional Curries",
    emoji: "🍛",
    tagline: "Sabzis, gravies & signature regional plates",
    items: [
      { name: "Palak Paneer", region: "Punjab", minerals: { calcium: "high", iron: "high", vitamin_a: "high" }, note: "Spinach purée with cottage cheese cubes" },
      { name: "Baingan Bharta", region: "Punjab", minerals: { potassium: "high", fiber: "high" }, note: "Smoked mashed eggplant with mustard oil" },
      { name: "Fish Molee", region: "Kerala", minerals: { protein: "high", vitamin_d: "high", iodine: "high" }, note: "Fish poached in coconut milk with turmeric" },
      { name: "Bhindi Masala", region: "Uttar Pradesh", minerals: { fiber: "high", magnesium: "medium" }, note: "Okra stir-fried with onion masala" },
      { name: "Avial", region: "Kerala", minerals: { fiber: "high", vitamin_c: "high" }, note: "Mixed vegetables in coconut-yogurt gravy" },
      { name: "Malabar Chicken Curry", region: "Kerala", minerals: { protein: "high", iron: "medium" }, note: "Chicken in coconut, curry leaves, black pepper" },
      { name: "Sarson ka Saag", region: "Punjab", minerals: { vitamin_k: "high", iron: "high", calcium: "high" }, note: "Slow-cooked mustard & bathua greens" },
    ],
  },
  {
    slug: "grains",
    label: "Grains & Rotis",
    emoji: "🌾",
    tagline: "Millets, whole-grain breads and rice bowls",
    items: [
      { name: "Bajra Roti", region: "Rajasthan", minerals: { iron: "high", magnesium: "high" }, note: "Pearl millet flatbread, gluten-free" },
      { name: "Jowar Bhakri", region: "Maharashtra", minerals: { fiber: "high", magnesium: "high" }, note: "Sorghum flatbread with ghee" },
      { name: "Ragi Mudde", region: "Karnataka", minerals: { calcium: "high", iron: "high" }, note: "Finger-millet dumplings" },
      { name: "Brown Rice", region: "Pan-India", minerals: { fiber: "medium", manganese: "high" }, note: "Whole grain rice, higher in bran" },
      { name: "Amaranth Roti", region: "Uttarakhand", minerals: { calcium: "high", protein: "high" }, note: "Rajgira flatbread, ideal for fasting" },
      { name: "Khichdi (Moong + Rice)", region: "Pan-India", minerals: { protein: "high", carbohydrates: "high" }, note: "One-pot dal-rice, comfort food" },
    ],
  },
  {
    slug: "snacks",
    label: "Snacks & Chaats",
    emoji: "🥟",
    tagline: "Sprouted, roasted & fermented street favourites",
    items: [
      { name: "Sprouted Moong Chaat", region: "Maharashtra", minerals: { protein: "high", vitamin_c: "high" }, note: "Sprouts with lemon, onion, tomato" },
      { name: "Roasted Chana", region: "Pan-India", minerals: { protein: "high", iron: "medium" }, note: "Dry-roasted chickpea snack" },
      { name: "Dhokla", region: "Gujarat", minerals: { protein: "medium", folate: "medium" }, note: "Steamed fermented besan cake" },
      { name: "Bhel Puri", region: "Mumbai", minerals: { fiber: "medium", potassium: "medium" }, note: "Puffed rice chaat with tamarind chutney" },
      { name: "Til Chikki", region: "North India", minerals: { calcium: "high", iron: "medium" }, note: "Sesame-jaggery brittle" },
    ],
  },
  {
    slug: "beverages",
    label: "Drinks & Dairy",
    emoji: "🥛",
    tagline: "Lassi, chaas, kadha and household staples",
    items: [
      { name: "Buttermilk (Chaas)", region: "Gujarat", minerals: { calcium: "high", potassium: "medium" }, note: "Salted spiced yogurt drink" },
      { name: "Sweet Lassi", region: "Punjab", minerals: { calcium: "high", protein: "medium" }, note: "Yogurt whisked with sugar and cardamom" },
      { name: "Haldi Doodh", region: "Pan-India", minerals: { calcium: "high", vitamin_d: "medium" }, note: "Warm turmeric milk" },
      { name: "Amla Juice", region: "North India", minerals: { vitamin_c: "high" }, note: "Indian gooseberry, exceptional vitamin C" },
      { name: "Kokum Sherbet", region: "Konkan", minerals: { potassium: "medium", vitamin_c: "medium" }, note: "Cooling summer drink" },
    ],
  },
];

export function getCategory(slug: string): CatalogCategory | undefined {
  return INDIAN_CATALOG.find((c) => c.slug === slug);
}

/** Household Indian dishes/ingredients that best correct a given deficiency. */
export const INDIAN_REMEDIES: Partial<Record<Mineral, { food: string; how: string }[]>> = {
  iron: [
    { food: "Ragi mudde or ragi malt", how: "Finger millet porridge — pair with lemon (amla) for absorption" },
    { food: "Palak-chana sabzi", how: "Spinach with chickpeas, tempered in iron kadhai" },
    { food: "Bajra roti with jaggery", how: "Traditional Rajasthani winter combo" },
    { food: "Rajma chawal", how: "Kidney beans + rice, add tomato for vitamin C" },
  ],
  calcium: [
    { food: "Ragi dosa or ragi mudde", how: "Highest calcium among Indian grains" },
    { food: "Til (sesame) chikki", how: "Traditional jaggery-sesame brittle" },
    { food: "Paneer bhurji", how: "Scrambled cottage cheese with masala" },
    { food: "Curd rice / dahi chawal", how: "Cooling South-Indian staple" },
  ],
  vitamin_d: [
    { food: "Fish molee (Kerala)", how: "Fatty fish in coconut milk" },
    { food: "Egg bhurji", how: "Yolks add vitamin D — pair with 15 min morning sun" },
    { food: "Mushroom sabzi (sun-dried)", how: "Sun-exposed mushrooms are a plant D source" },
  ],
  vitamin_c: [
    { food: "Amla murabba or juice", how: "Indian gooseberry — richest household source" },
    { food: "Guava with chaat masala", how: "Everyday winter fruit" },
    { food: "Nimbu pani", how: "Fresh lemon water with a pinch of rock salt" },
  ],
  vitamin_b12: [
    { food: "Curd / dahi with meals", how: "Fermented dairy — small daily amounts" },
    { food: "Egg curry", how: "Two eggs cover most of daily B12" },
    { food: "Fortified soy milk / nutritional yeast", how: "For vegetarians and Jains" },
  ],
  folate: [
    { food: "Methi thepla", how: "Fenugreek greens are folate-dense" },
    { food: "Chana masala", how: "Chickpeas are among the highest plant folate" },
    { food: "Palak dal", how: "Spinach + toor dal combo" },
  ],
  magnesium: [
    { food: "Bajra khichdi", how: "Pearl millet + moong dal" },
    { food: "Cashew or almond-based sabzi (korma)", how: "Nuts add magnesium and healthy fats" },
    { food: "Dark chocolate (70%)", how: "Small square post-meal" },
  ],
  zinc: [
    { food: "Pumpkin seed chutney", how: "Roast & grind with garlic and salt" },
    { food: "Chana chaat", how: "Chickpeas + onion + lemon" },
    { food: "Mutton curry (occasional)", how: "Red meat is one of the richest zinc sources" },
  ],
  potassium: [
    { food: "Nariyal pani (coconut water)", how: "Natural electrolyte replacement" },
    { food: "Kela (banana)", how: "Everyday potassium hit" },
    { food: "Rajma / lobia", how: "Beans are potassium-dense" },
  ],
  fiber: [
    { food: "Jowar bhakri with sabzi", how: "Whole-grain sorghum flatbread" },
    { food: "Sprouted moong salad", how: "High fiber + protein" },
    { food: "Baingan bharta", how: "Roasted eggplant, keeps skin on" },
  ],
  protein: [
    { food: "Dal + rice combo", how: "Traditional complementary protein" },
    { food: "Paneer tikka", how: "Grilled cottage cheese" },
    { food: "Egg curry or fish curry", how: "Complete-protein options" },
  ],
  iodine: [
    { food: "Iodized namak in cooking", how: "Everyday household salt covers baseline" },
    { food: "Fish molee or prawn curry", how: "Seafood is naturally iodine-rich" },
    { food: "Curd", how: "Small daily iodine contribution" },
  ],
};

export function remediesFor(mineral: Mineral): { food: string; how: string }[] {
  return INDIAN_REMEDIES[mineral] ?? [
    { food: "Mixed thali (dal + sabzi + roti + curd)", how: "Balanced Indian plate covers most micronutrients" },
  ];
}