import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType, text } = req.body;

    const contents: any[] = [];

    if (imageBase64) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    const prompt = text
      ? `Analyze this food description: "${text}". Provide food items, gram weights, and clarifying questions as JSON.`
      : 'Identify the food in this image, estimated grams, and nutritional details in JSON format.';

    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    return res.status(200).json({
      name: 'Analyzed Meal',
      foods: [{ name: 'Identified Dish', grams: 200 }],
      questions: [
        { id: 'fat', label: 'Cooked with which fat?', options: ['None', 'Olive oil', 'Butter'] },
      ],
      rawText: response.text,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to analyze meal' });
  }
}