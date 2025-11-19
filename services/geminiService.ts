

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDescription = async (itemName: string): Promise<string> => {
  try {
    const prompt = `Generate a professional, concise, one-sentence description for a quotation or invoice item based on its name: "${itemName}". Ensure it is clear and business-appropriate. For example, if the input item name is "web design", a good output description would be "Comprehensive web design services including UI/UX, development, and deployment of a responsive website." Do not add any introductory text like "Here is a description:". Just provide the description itself.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 100, // Limit output to prevent overly long descriptions
        temperature: 0.7,
      },
    });

    const text = response.text.trim();
    // Clean up potential markdown like quotes or asterisks
    return text.replace(/^["*]+|["*]+$/g, '');
  } catch (error) {
    console.error("Error generating description with Gemini:", error);
    // Provide a user-friendly error message
    return "Error generating description. Please check your connection or API key.";
  }
};