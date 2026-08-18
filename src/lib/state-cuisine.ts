import type { Mineral } from "@/lib/nutrition";

export type StateDish = {
  name: string;
  note: string;
  rich: Mineral[];
};

export type StateCuisine = {
  code: string;
  label: string;
  tagline: string;
  dishes: StateDish[];
};

export const STATE_CUISINES: StateCuisine[] = [
  {
    code: "tamil-nadu", label: "Tamil Nadu", tagline: "Idli, sambar, kootu & millet classics",
    dishes: [
      { name: "Keerai Kootu", note: "Amaranth greens simmered with moong dal", rich: ["iron", "calcium", "folate", "fiber"] },
      { name: "Ragi Kali / Kanji", note: "Finger millet porridge with buttermilk", rich: ["calcium", "iron", "magnesium"] },
      { name: "Sambar with Drumstick", note: "Toor dal, tamarind and moringa pods", rich: ["protein", "vitamin_c", "potassium"] },
      { name: "Meen Kuzhambu", note: "Tamarind fish curry", rich: ["protein", "vitamin_d", "iodine", "selenium"] },
      { name: "Sundal", note: "Steamed chana with coconut, evening snack", rich: ["protein", "zinc", "fiber"] },
    ],
  },
  {
    code: "kerala", label: "Kerala", tagline: "Coconut, seafood & tapioca staples",
    dishes: [
      { name: "Puttu with Kadala Curry", note: "Steamed rice cake with black chickpeas", rich: ["iron", "protein", "fiber"] },
      { name: "Fish Molee", note: "Fish poached in coconut milk", rich: ["vitamin_d", "iodine", "protein", "selenium"] },
      { name: "Thoran (cabbage/beans)", note: "Stir-fry with grated coconut", rich: ["fiber", "vitamin_c", "vitamin_k"] },
      { name: "Avial", note: "Mixed vegetables in coconut-yogurt gravy", rich: ["potassium", "vitamin_a", "calcium"] },
    ],
  },
  {
    code: "karnataka", label: "Karnataka", tagline: "Ragi, bisi bele bath & coastal fare",
    dishes: [
      { name: "Ragi Mudde", note: "Finger-millet dumpling with saaru", rich: ["calcium", "iron", "magnesium"] },
      { name: "Bisi Bele Bath", note: "Rice, toor dal and vegetables", rich: ["protein", "fiber", "potassium"] },
      { name: "Majjige Huli", note: "Buttermilk curry with ash gourd", rich: ["calcium", "vitamin_b12"] },
      { name: "Neer Dosa with Chutney", note: "Rice crepes with coconut-chana chutney", rich: ["carbohydrates", "manganese"] },
    ],
  },
  {
    code: "andhra-telangana", label: "Andhra & Telangana", tagline: "Jowar, gongura & spicy pappu",
    dishes: [
      { name: "Gongura Pappu", note: "Sorrel leaves with toor dal", rich: ["iron", "vitamin_c", "folate"] },
      { name: "Pesarattu", note: "Whole green-moong crepe with ginger", rich: ["protein", "magnesium", "fiber"] },
      { name: "Jonna Rotte", note: "Jowar flatbread", rich: ["fiber", "magnesium", "iron"] },
      { name: "Royyala Iguru", note: "Prawn masala", rich: ["protein", "iodine", "selenium", "zinc"] },
    ],
  },
  {
    code: "maharashtra", label: "Maharashtra", tagline: "Poha, bhakri, usal & koshimbir",
    dishes: [
      { name: "Matki Usal", note: "Sprouted moth-bean curry", rich: ["protein", "iron", "folate"] },
      { name: "Jowar Bhakri", note: "Sorghum flatbread with ghee", rich: ["fiber", "magnesium"] },
      { name: "Kanda Poha", note: "Flattened rice with peanuts, lemon", rich: ["iron", "carbohydrates", "vitamin_c"] },
      { name: "Koshimbir", note: "Cucumber-peanut-curd salad", rich: ["calcium", "potassium", "vitamin_c"] },
    ],
  },
  {
    code: "gujarat", label: "Gujarat", tagline: "Thepla, dhokla & undhiyu",
    dishes: [
      { name: "Methi Thepla", note: "Fenugreek whole-wheat flatbread", rich: ["iron", "folate", "fiber"] },
      { name: "Khaman Dhokla", note: "Steamed fermented besan cake", rich: ["protein", "folate"] },
      { name: "Undhiyu", note: "Winter mixed-vegetable casserole", rich: ["fiber", "vitamin_a", "potassium"] },
      { name: "Chaas", note: "Spiced buttermilk with every meal", rich: ["calcium", "vitamin_b12", "potassium"] },
    ],
  },
  {
    code: "rajasthan", label: "Rajasthan", tagline: "Bajra, gatte & desert greens",
    dishes: [
      { name: "Bajra Roti with Gud", note: "Pearl millet flatbread with jaggery", rich: ["iron", "magnesium", "fiber"] },
      { name: "Gatte ki Sabzi", note: "Besan dumplings in yogurt gravy", rich: ["protein", "calcium"] },
      { name: "Ker Sangri", note: "Desert berries and beans", rich: ["fiber", "iron", "potassium"] },
      { name: "Kadhi Pakora", note: "Yogurt-besan curry", rich: ["calcium", "protein", "vitamin_b12"] },
    ],
  },
  {
    code: "punjab", label: "Punjab", tagline: "Sarson da saag, rajma & dairy",
    dishes: [
      { name: "Sarson da Saag with Makki Roti", note: "Slow-cooked mustard greens", rich: ["vitamin_k", "iron", "calcium", "vitamin_a"] },
      { name: "Rajma Chawal", note: "Kidney beans with rice", rich: ["iron", "protein", "potassium", "fiber"] },
      { name: "Palak Paneer", note: "Spinach with cottage cheese", rich: ["calcium", "iron", "vitamin_a"] },
      { name: "Lassi", note: "Whisked yogurt drink", rich: ["calcium", "protein", "vitamin_b12"] },
    ],
  },
  {
    code: "west-bengal", label: "West Bengal", tagline: "Fish, shukto & posto",
    dishes: [
      { name: "Macher Jhol", note: "Light fish curry with potato", rich: ["protein", "vitamin_d", "iodine", "selenium"] },
      { name: "Shukto", note: "Mixed vegetables with bitter gourd", rich: ["fiber", "vitamin_a", "potassium"] },
      { name: "Cholar Dal", note: "Bengal gram with coconut", rich: ["protein", "folate", "iron"] },
      { name: "Doi (Mishti Doi)", note: "Set curd", rich: ["calcium", "vitamin_b12"] },
    ],
  },
  {
    code: "odisha", label: "Odisha", tagline: "Pakhala, saga & seafood",
    dishes: [
      { name: "Pakhala Bhata", note: "Fermented rice water with curd", rich: ["vitamin_b12", "potassium", "carbohydrates"] },
      { name: "Saga Bhaja", note: "Stir-fried leafy greens", rich: ["iron", "vitamin_a", "folate"] },
      { name: "Chhena Poda", note: "Baked cottage cheese", rich: ["calcium", "protein"] },
      { name: "Machha Besara", note: "Fish in mustard gravy", rich: ["protein", "vitamin_d", "selenium"] },
    ],
  },
  {
    code: "uttar-pradesh", label: "Uttar Pradesh", tagline: "Bhindi, arhar dal & chaat",
    dishes: [
      { name: "Lobia Curry", note: "Black-eyed peas in tomato masala", rich: ["iron", "folate", "protein"] },
      { name: "Bhindi Masala", note: "Okra with onion masala", rich: ["fiber", "magnesium", "vitamin_c"] },
      { name: "Arhar Dal with Roti", note: "Toor dal with whole-wheat roti", rich: ["protein", "fiber"] },
      { name: "Amla Murabba", note: "Preserved gooseberry", rich: ["vitamin_c"] },
    ],
  },
  {
    code: "bihar-jharkhand", label: "Bihar & Jharkhand", tagline: "Sattu, litti & seasonal greens",
    dishes: [
      { name: "Sattu Paratha / Sharbat", note: "Roasted gram flour, cooling and protein-dense", rich: ["protein", "iron", "fiber"] },
      { name: "Litti Chokha", note: "Sattu-stuffed dough with mashed brinjal", rich: ["protein", "potassium", "fiber"] },
      { name: "Saag with Makai", note: "Local greens with maize roti", rich: ["iron", "calcium", "vitamin_a"] },
    ],
  },
  {
    code: "madhya-pradesh", label: "Madhya Pradesh & Chhattisgarh", tagline: "Kodo millet, dal bafla & bhutte",
    dishes: [
      { name: "Dal Bafla", note: "Baked wheat balls with toor dal", rich: ["protein", "fiber"] },
      { name: "Kodo / Kutki Millet Khichdi", note: "Tribal millets with moong", rich: ["magnesium", "iron", "fiber"] },
      { name: "Bhutte ka Kees", note: "Grated corn with milk", rich: ["carbohydrates", "calcium"] },
    ],
  },
  {
    code: "assam-northeast", label: "Assam & North East", tagline: "Fermented greens, bamboo shoot & fish",
    dishes: [
      { name: "Masor Tenga", note: "Tangy fish curry with tomato", rich: ["protein", "vitamin_d", "vitamin_c", "iodine"] },
      { name: "Khar with Local Greens", note: "Alkaline preparation with leafy greens", rich: ["iron", "potassium", "vitamin_a"] },
      { name: "Bamboo Shoot Fry", note: "Fermented bamboo with pork or beans", rich: ["fiber", "zinc", "protein"] },
    ],
  },
  {
    code: "goa-konkan", label: "Goa & Konkan", tagline: "Coastal fish, kokum & coconut",
    dishes: [
      { name: "Fish Curry Rice", note: "Coconut-kokum fish curry", rich: ["protein", "vitamin_d", "iodine", "selenium"] },
      { name: "Sol Kadhi", note: "Kokum and coconut milk digestive", rich: ["potassium", "vitamin_c"] },
      { name: "Prawn Balchao", note: "Spiced prawn preserve", rich: ["zinc", "protein", "selenium"] },
    ],
  },
  {
    code: "delhi-haryana", label: "Delhi & Haryana", tagline: "Bajra khichdi, chole & dairy",
    dishes: [
      { name: "Bajra Khichdi with Ghee", note: "Pearl millet and moong dal", rich: ["iron", "magnesium", "protein"] },
      { name: "Chole", note: "Chickpeas in anardana masala", rich: ["protein", "iron", "folate"] },
      { name: "Dahi with Every Meal", note: "Home-set curd", rich: ["calcium", "vitamin_b12"] },
    ],
  },
  {
    code: "kashmir-himachal-uttarakhand", label: "Kashmir, Himachal & Uttarakhand", tagline: "Rajma, mandua & haak",
    dishes: [
      { name: "Haak Saag", note: "Kashmiri collard greens", rich: ["iron", "vitamin_k", "calcium"] },
      { name: "Mandua (Ragi) Roti", note: "Hill finger-millet flatbread", rich: ["calcium", "iron", "magnesium"] },
      { name: "Bhatt ki Churkani", note: "Black soybean curry", rich: ["protein", "iron", "magnesium"] },
    ],
  },
];

export function getStateCuisine(code?: string): StateCuisine | undefined {
  return STATE_CUISINES.find((s) => s.code === code);
}

/** Dishes from the user's own state that are rich in a given nutrient (7-day gap fixes). */
export function localRemediesFor(code: string | undefined, mineral: Mineral) {
  const cuisine = getStateCuisine(code);
  if (!cuisine) return [];
  return cuisine.dishes
    .filter((d) => d.rich.includes(mineral))
    .map((d) => ({ food: d.name, how: d.note, state: cuisine.label }));
}
