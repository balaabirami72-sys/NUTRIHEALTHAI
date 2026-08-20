import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

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

    // STAGE 2: Calculate macros & micronutrients based on image + user details
    if (answers && answers.length > 0) {
      const prompt = `
        You are a clinical dietitian and Indian nutrition expert.
        Analyze the uploaded food image/description along with these specific user answers:
        ${JSON.stringify(answers)}

        Task:
        1. Identify each dish component and estimate its weight in grams.
        2. Calculate total macronutrients (Calories, Protein, Carbs, Fat, Fiber).
        3. Dynamically estimate exact non-zero micronutrient and mineral contents based on standard USDA / Indian Food Composition Tables (IFCT) for these exact foods and quantities.

        Return ONLY a JSON object matching this exact schema key structure (use numbers only):
        {
          "name": "Full Meal Title (e.g., Paneer Butter Masala with 2 Butter Naan)",
          "foods": [
            { "name": "Paneer Butter Masala", "grams": 250 },
            { "name": "Butter Naan", "grams": 120 }
          ],
          "prepNotes": "Brief summary of estimated oil/fat usage, cooking style, and portion sizing.",
          "macros": {
            "calories": 850,
            "protein": 28,
            "carbs": 82,
            "fat": 46,
            "fiber": 8
          },
          "micronutrients": {
            "carbs": 82,
            "fiber": 8,
            "protein": 28,
            "fat": 46,
            "sat_fat": 18,
            "vitamin_a": 320,
            "vitamin_c": 14,
            "vitamin_d": 0.8,
            "vitamin_e": 2.1,
            "vitamin_k": 8,
            "thiamin": 0.4,
            "riboflavin": 0.5,
            "niacin": 3.8,
            "pantothenic_acid": 1.2,
            "vitamin_b6": 0.6,
            "biotin": 4,
            "folate": 65,
            "vitamin_b12": 1.1,
            "calcium": 480,
            "phosphorus": 510,
            "magnesium": 85,
            "sodium": 1120,
            "potassium": 640,
            "chloride": 750,
            "sulfur": 95,
            "iron": 4.2,
            "zinc": 3.1,
            "copper": 0.4,
            "selenium": 22,
            "iodine": 12,
            "manganese": 0.8,
            "chromium": 5,
            "fluoride": 0.05,
            "molybdenum": 15,
            "cobalt": 0,
            "chlorine": 0,
            "vanadium": 0,
            "nickel": 0
          }
        }

        CRITICAL RULE: Never return 0.0 for vitamins or minerals if the ingredients naturally contain them (e.g., dairy contains Calcium/B12, vegetables contain Vitamin C/A, pulses contain Iron/Folate).
      `;
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { responseMimeType: 'application/json' },
      });

      return res.status(200).json(JSON.parse(response.text || '{}'));
    }

    // STAGE 1: Initial identification & generating clarifying questions
    const initialPrompt = `
      Identify the food items present in this image or description.
      
      Return JSON with:
      1. "name": Title of the meal.
      2. "foods": List of identified food components with estimated weight [{ "name": string, "grams": number }].
      3. "questions": Generate 5 to 8 specific clarifying questions regarding portion size, oil/ghee type, cooking method, side dishes, and hidden ingredients to accurately estimate calories and nutrients.
         Format each question as:
         {
           "id": "q1",
           "label": "Question text?",
           "options": ["Option 1", "Option 2", "Option 3"]
         }
    `;
    contents.push(initialPrompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { responseMimeType: 'application/json' },
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error("Analyze Error:", error?.message || error);
    return res.status(500).json({ error: 'Failed to analyze meal', details: error?.message });
  }
}