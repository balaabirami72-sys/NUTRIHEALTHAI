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

    // STAGE 2: Answers submitted -> Compute full macro + micro + mineral breakdown
    if (answers && answers.length > 0) {
      const prompt = `
        Analyze this meal along with the user's detailed answers:
        User details: ${JSON.stringify(answers)}
        
        Return a single JSON object matching this exact structure:
        {
          "name": "Specific dish name (e.g., Poori with Chana Masala & Aloo Sabzi)",
          "foods": [
            { "name": "Poori", "grams": 140 },
            { "name": "Chana Masala", "grams": 220 },
            { "name": "Aloo Sabzi", "grams": 220 }
          ],
          "prepNotes": "Short summary of preparation style, oils used, and portion estimation.",
          "macros": {
            "calories": 1340,
            "protein": 36,
            "carbs": 171,
            "fat": 61,
            "fiber": 27
          },
          "micronutrients": {
            "vitaminA": 450,
            "vitaminC": 35,
            "vitaminD": 0,
            "vitaminE": 4.5,
            "vitaminK": 22,
            "thiamin": 0.8,
            "riboflavin": 0.6,
            "niacin": 7.2,
            "pantothenicAcid": 2.1,
            "vitaminB6": 1.1,
            "biotin": 5,
            "folate": 180,
            "vitaminB12": 0.2,
            "calcium": 240,
            "phosphorus": 570,
            "magnesium": 225,
            "sodium": 1500,
            "potassium": 1570,
            "chloride": 900,
            "sulfur": 150,
            "iron": 11,
            "zinc": 4.5,
            "copper": 0.9,
            "selenium": 30,
            "iodine": 15,
            "manganese": 2.3,
            "chromium": 12,
            "fluoride": 0.1,
            "molybdenum": 25,
            "cobalt": 0,
            "chlorine": 0,
            "vanadium": 0,
            "nickel": 0
          }
        }
        
        IMPORTANT: Populate estimated non-zero values for key vitamins and minerals based on standard clinical dietary tables for these ingredients. Do NOT return empty or zeroed micronutrient objects.
      `;
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { responseMimeType: 'application/json' },
      });

      return res.status(200).json(JSON.parse(response.text || '{}'));
    }

    // STAGE 1: Initial identification & generating questions
    const initialPrompt = `
      Identify the food in the image/description.
      
      Return JSON with:
      1. "name": Detailed title of the dish or meal.
      2. "foods": List of identified components with estimated weight [{ "name": string, "grams": number }].
      3. "questions": Generate EXACTLY between 5 and 10 relevant clarifying questions to determine portion size, cooking oil/fat, hidden ingredients, brand/preparation method, and additions.
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