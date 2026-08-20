import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const usdaApiKey = process.env.USDA_API_KEY || 'DEMO_KEY'; // Uses DEMO_KEY if not configured yet

const ai = new GoogleGenAI({ apiKey: geminiApiKey || '' });

// USDA Nutrient ID Mapping Table
const NUTRIENT_MAP: Record<number, string> = {
  1008: 'calories',
  1003: 'protein',
  1005: 'carbs',
  1004: 'fat',
  1079: 'fiber',
  1258: 'satFat',
  1106: 'vitaminA',
  1162: 'vitaminC',
  1114: 'vitaminD',
  1109: 'vitaminE',
  1185: 'vitaminK',
  1165: 'thiamin',
  1166: 'riboflavin',
  1167: 'niacin',
  1170: 'pantothenicAcid',
  1175: 'vitaminB6',
  1177: 'folate',
  1178: 'vitaminB12',
  1087: 'calcium',
  1091: 'phosphorus',
  1090: 'magnesium',
  1093: 'sodium',
  1092: 'potassium',
  1089: 'iron',
  1095: 'zinc',
  1098: 'copper',
  1103: 'selenium',
  1099: 'fluouride',
  1101: 'manganese',
};

// Fetch official nutrition per 100g from USDA API
async function fetchUSDANutrients(foodName: string) {
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
        foodName
      )}&pageSize=1&api_key=${usdaApiKey}`
    );
    const data = await res.json();
    if (data.foods && data.foods.length > 0) {
      return data.foods[0].foodNutrients || [];
    }
  } catch (err) {
    console.error(`USDA Search error for ${foodName}:`, err);
  }
  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType, text, answers } = req.body;
    const contents: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    if (text) contents.push(text);

    // STAGE 2: Perform USDA database calculation
    if (answers && answers.length > 0) {
      const prompt = `
        Identify all food components and exact portion weights in grams from this image and user answers:
        ${JSON.stringify(answers)}

        Return JSON matching this format:
        {
          "name": "Full Meal Title",
          "prepNotes": "Short summary of cooking method and oils used.",
          "foods": [
            { "name": "Standard USDA search name (e.g., Chickpea curry)", "grams": 175 },
            { "name": "Fried wheat bread", "grams": 245 }
          ]
        }
      `;
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      const foodsList = parsed.foods || [];

      // Accumulator objects for macros and micros
      const macros = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      const micronutrients: Record<string, number> = {
        carbs: 0, fiber: 0, protein: 0, fat: 0, satFat: 0,
        vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0,
        thiamin: 0, riboflavin: 0, niacin: 0, pantothenicAcid: 0, vitaminB6: 0,
        biotin: 0, folate: 0, vitaminB12: 0, calcium: 0, phosphorus: 0,
        magnesium: 0, sodium: 0, potassium: 0, chloride: 0, sulfur: 0,
        iron: 0, zinc: 0, copper: 0, selenium: 0, iodine: 0, manganese: 0,
        chromium: 0, fluoride: 0, molybdenum: 0, cobalt: 0, chlorine: 0, vanadium: 0, nickel: 0
      };

      // Query USDA API for each recognized ingredient and calculate weights
      for (const item of foodsList) {
        const usdaNutrients = await fetchUSDANutrients(item.name);
        const multiplier = item.grams / 100; // USDA stores values per 100g

        usdaNutrients.forEach((n: any) => {
          const key = NUTRIENT_MAP[n.nutrientId];
          const calculatedValue = Number((n.value * multiplier).toFixed(1));

          if (key) {
            if (key in macros) {
              (macros as any)[key] = Number(((macros as any)[key] + calculatedValue).toFixed(1));
            }
            if (key in micronutrients) {
              micronutrients[key] = Number((micronutrients[key] + calculatedValue).toFixed(1));
            }
          }
        });
      }

      // Sync core macros to micronutrients grid
      micronutrients.carbs = macros.carbs;
      micronutrients.fiber = macros.fiber;
      micronutrients.protein = macros.protein;
      micronutrients.fat = macros.fat;

      return res.status(200).json({
        name: parsed.name,
        prepNotes: parsed.prepNotes,
        foods: foodsList,
        macros,
        micronutrients,
      });
    }

    // STAGE 1: Generating questions
    const initialPrompt = `
      Identify the food in the image/description.
      Return JSON:
      1. "name": Title of the meal.
      2. "foods": List of items with estimated weights [{ "name": string, "grams": number }].
      3. "questions": 5-8 clarifying questions on cooking methods, oils, portion size.
         [{ "id": "q1", "label": "Text?", "options": ["A", "B"] }]
    `;
    contents.push(initialPrompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { responseMimeType: 'application/json' },
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('API Error:', error?.message || error);
    return res.status(500).json({ error: 'Failed to analyze meal', details: error?.message });
  }
}