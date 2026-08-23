import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const usdaApiKey = process.env.USDA_API_KEY || 'DEMO_KEY';

if (!geminiApiKey) {
  console.error("Missing GEMINI_API_KEY in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey || '' });

// Standard USDA Nutrient IDs -> UI Card Keys Mapping
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
  1099: 'fluoride',
  1101: 'manganese',
};

// Query USDA Database per 100g
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

// Generate with automatic retry and model fallback (Fixes 503 Overloaded errors)
async function generateWithFallback(contents: any[]) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { responseMimeType: 'application/json' },
        });
        return response;
      } catch (error: any) {
        const status = error?.status || error?.code;
        if ((status === 503 || status === 429) && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        if (model === models[models.length - 1] && attempt === 2) {
          throw error;
        }
      }
    }
  }
  throw new Error('All Gemini model attempts failed');
}

// Helper to safely parse AI responses by removing potential markdown fences
function parseJsonResponse(rawText: string | undefined) {
  const cleanText = (rawText || '{}')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleanText);
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

    if (text) {
      contents.push(text);
    }

    // STAGE 2: Perform automated calculation via USDA DB + Gemini Detection
    if (answers && answers.length > 0) {
      const prompt = `
        You are a nutrition analysis engine.
        Analyze the image and user responses to determine food items and exact weights:
        ${JSON.stringify(answers)}

        Return JSON in this exact format:
        {
          "name": "Full Meal Name",
          "prepNotes": "Short preparation and oil usage summary.",
          "foods": [
            { "name": "Standard USDA food item query (e.g., Chickpea curry)", "grams": 175 },
            { "name": "Fried wheat bread", "grams": 245 }
          ]
        }
      `;
      contents.push(prompt);

      const response = await generateWithFallback(contents);
      const parsed = parseJsonResponse(response.text);
      const foodsList = parsed.foods || [];

      // Initialize base totals
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

      // Fetch USDA nutrients in parallel to prevent Vercel execution timeout
      const foodPromises = foodsList.map(async (item: { name: string; grams: number }) => {
        const usdaNutrients = await fetchUSDANutrients(item.name);
        return { item, usdaNutrients };
      });

      const results = await Promise.all(foodPromises);

      // Accumulate total macros and micronutrients mathematically
      for (const { item, usdaNutrients } of results) {
        const multiplier = item.grams / 100;

        usdaNutrients.forEach((n: any) => {
          const key = NUTRIENT_MAP[n.nutrientId];
          const val = Number((n.value * multiplier).toFixed(1));

          if (key) {
            if (key in macros) {
              (macros as any)[key] = Number(((macros as any)[key] + val).toFixed(1));
            }
            if (key in micronutrients) {
              micronutrients[key] = Number((micronutrients[key] + val).toFixed(1));
            }
          }
        });
      }

      // Sync top macros with micronutrient object
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

    // STAGE 1: Identification & Clarifying Questions Generation
    const initialPrompt = `
      Identify the food in the image/description.
      Return JSON in this format:
      {
        "name": "Meal Title",
        "foods": [{ "name": "Item Name", "grams": 100 }],
        "questions": [
          { "id": "q1", "label": "Question text?", "options": ["Option 1", "Option 2"] }
        ]
      }
    `;
    contents.push(initialPrompt);

    const response = await generateWithFallback(contents);
    const parsedInitial = parseJsonResponse(response.text);
    return res.status(200).json(parsedInitial);
  } catch (error: any) {
    console.error("API Processing Error:", error?.message || error);
    return res.status(500).json({ error: 'Failed to analyze meal', details: error?.message });
  }
}