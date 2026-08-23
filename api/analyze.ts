import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const usdaApiKey = process.env.USDA_API_KEY || 'DEMO_KEY';

if (!geminiApiKey) {
  console.error("Missing GEMINI_API_KEY in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey || '' });

// Standard USDA Nutrient IDs (Legacy 1000s & Modern FDC 300s)
const NUTRIENT_MAP: Record<number, string> = {
  // Macros
  1008: 'calories', 208: 'calories',
  1003: 'protein',  203: 'protein',
  1005: 'carbs',    205: 'carbs',
  1004: 'fat',      204: 'fat',
  1079: 'fiber',    291: 'fiber',
  1258: 'satFat',   606: 'satFat',

  // Vitamins
  1106: 'vitaminA', 320: 'vitaminA',
  1162: 'vitaminC', 401: 'vitaminC',
  1114: 'vitaminD', 324: 'vitaminD',
  1109: 'vitaminE', 323: 'vitaminE',
  1185: 'vitaminK', 430: 'vitaminK',
  1165: 'thiamin',  404: 'thiamin',
  1166: 'riboflavin', 405: 'riboflavin',
  1167: 'niacin',   406: 'niacin',
  1170: 'pantothenicAcid', 410: 'pantothenicAcid',
  1175: 'vitaminB6', 415: 'vitaminB6',
  1177: 'folate',   435: 'folate',
  1178: 'vitaminB12', 418: 'vitaminB12',

  // Minerals
  1087: 'calcium',  301: 'calcium',
  1091: 'phosphorus', 305: 'phosphorus',
  1090: 'magnesium', 304: 'magnesium',
  1093: 'sodium',   307: 'sodium',
  1092: 'potassium', 306: 'potassium',
  1089: 'iron',     303: 'iron',
  1095: 'zinc',     309: 'zinc',
  1098: 'copper',   312: 'copper',
  1103: 'selenium', 317: 'selenium',
  1099: 'fluoride', 313: 'fluoride',
  1101: 'manganese', 315: 'manganese',
};

// Query USDA Database per 100g
async function fetchUSDANutrients(foodName: string) {
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
        foodName
      )}&pageSize=1&api_key=${usdaApiKey}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.error(`USDA API returned status ${res.status} for query: ${foodName}`);
      return [];
    }

    const data = await res.json();
    if (data.foods && data.foods.length > 0) {
      return data.foods[0].foodNutrients || [];
    }
  } catch (err) {
    console.error(`USDA Search error for ${foodName}:`, err);
  }
  return [];
}

// Generate with automatic retry and model fallback
async function generateWithFallback(contents: any[]) {
  const models = ['gemini-2.5-flash'];

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
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        throw error;
      }
    }
  }
  throw new Error('All Gemini model attempts failed');
}

// Helper to safely parse AI responses
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

        IMPORTANT: Return generic standard terms for food queries so USDA DB searches succeed (e.g., "Chickpeas cooked" instead of "Special Curry").

        Return JSON in this exact format:
        {
          "name": "Full Meal Name",
          "prepNotes": "Short preparation and oil usage summary.",
          "foods": [
            { "name": "Chickpeas, cooked", "grams": 175 },
            { "name": "Wheat bread", "grams": 245 }
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

      // Fetch USDA nutrients in parallel
      const foodPromises = foodsList.map(async (item: { name: string; grams: number }) => {
        const usdaNutrients = await fetchUSDANutrients(item.name);
        return { item, usdaNutrients };
      });

      const results = await Promise.all(foodPromises);

      // Accumulate total macros and micronutrients mathematically
      for (const { item, usdaNutrients } of results) {
        const multiplier = item.grams / 100;

        usdaNutrients.forEach((n: any) => {
          const id = n.nutrientId || n.nutrientNumber || n.nutrient?.id || n.id;
          const key = NUTRIENT_MAP[Number(id)];
          
          const rawVal = n.value ?? n.amount ?? 0;
          const val = Number((rawVal * multiplier).toFixed(1));

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

      // Check key minerals specifically to verify if USDA mapped properly
      const hasKeyMinerals = micronutrients.calcium > 0 || micronutrients.iron > 0 || micronutrients.sodium > 0;

      // Fall back to Gemini calculation if essential micronutrients were missed by USDA
      if (!hasKeyMinerals && foodsList.length > 0) {
        const fallbackPrompt = `
          Calculate realistic estimated micronutrients for this meal based on the identified foods and user answers:
          Foods: ${JSON.stringify(foodsList)}
          User Answers: ${JSON.stringify(answers)}

          Return strictly JSON mapping these exact keys to numbers:
          "satFat", "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminK", "thiamin", "riboflavin", "niacin", "pantothenicAcid", "vitaminB6", "folate", "vitaminB12", "calcium", "phosphorus", "magnesium", "sodium", "potassium", "iron", "zinc", "copper", "selenium", "manganese"
        `;
        try {
          const fallbackRes = await generateWithFallback([fallbackPrompt]);
          const estimatedMicros = parseJsonResponse(fallbackRes.text);
          Object.assign(micronutrients, estimatedMicros);
        } catch (e) {
          console.error("Micronutrient fallback failed:", e);
        }
      }

      // Sync top macros into micronutrient object
      micronutrients.carbs = macros.carbs;
      micronutrients.fiber = macros.fiber;
      micronutrients.protein = macros.protein;
      micronutrients.fat = macros.fat;

      // Provide alias keys expected by various front-end dashboard cards
      const mappedMicros: Record<string, number> = {
        ...micronutrients,
        vitA: micronutrients.vitaminA || 0,
        vitC: micronutrients.vitaminC || 0,
        vitD: micronutrients.vitaminD || 0,
        vitE: micronutrients.vitaminE || 0,
        vitK: micronutrients.vitaminK || 0,
        b1: micronutrients.thiamin || 0,
        b2: micronutrients.riboflavin || 0,
        b3: micronutrients.niacin || 0,
        b5: micronutrients.pantothenicAcid || 0,
        b6: micronutrients.vitaminB6 || 0,
        b12: micronutrients.vitaminB12 || 0,
      };

      return res.status(200).json({
        name: parsed.name,
        prepNotes: parsed.prepNotes,
        foods: foodsList,
        macros,
        micronutrients: mappedMicros,
      });
    }

    // STAGE 1: Dynamic Identification & Item-Specific Clarifying Questions Generation
    const initialPrompt = `
      Analyze the food image/description carefully.
      
      1. Identify all individual food items visible in the meal.
      2. Generate 5 to 8 dynamic clarifying questions tailored SPECIFICALLY to the detected foods to calculate exact gram weights and micronutrient density.
      
      Return strictly valid JSON in this exact format:
      {
        "name": "Meal Title",
        "foods": [{ "name": "Identified Food Item", "grams": 100 }],
        "questions": [
          {
            "id": "q1",
            "label": "Food-specific question text?",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
          }
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