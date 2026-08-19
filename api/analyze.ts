import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    // STAGE 2: If answers are submitted, compute complete nutrients & breakdown
    if (answers && answers.length > 0) {
      const prompt = `
        Analyze this meal along with the user's answers:
        User details: ${JSON.stringify(answers)}
        
        Return JSON with:
        1. "name": Specific dish name (e.g., "Puri with Potato Masala & Sambhar")
        2. "foods": List of identified items with individual estimated weight in grams [{ "name": string, "grams": number }]
        3. "prepNotes": Short summary of preparation style and portion estimation
        4. "minerals": Object containing calculated values for: iron, calcium, magnesium, zinc, potassium, sodium, phosphorus, copper, manganese, selenium (all numbers in mg or mcg standard units)
        5. "macros": Object containing: calories (kcal), protein (g), carbs (g), fat (g), fiber (g)
      `;
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { responseMimeType: 'application/json' },
      });

      return res.status(200).json(JSON.parse(response.text || '{}'));
    }

    // STAGE 1: Initial identification and generating 5–10 clarifying questions
    const initialPrompt = `
      Identify the food in the image/description.
      
      Return JSON with:
      1. "name": Detailed title of the dish or meal.
      2. "foods": List of identified food components with estimated weight [{ "name": string, "grams": number }].
      3. "questions": Generate EXACTLY between 5 and 10 relevant, specific clarifying questions to accurately determine portion size, cooking oil/fat, hidden ingredients, brand/preparation method, and additions.
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to analyze meal' });
  }
}