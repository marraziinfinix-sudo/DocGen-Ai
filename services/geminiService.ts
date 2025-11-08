

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDescription = async (productName: string): Promise<string> => {
  try {
    const prompt = `Generate a professional, one-sentence description for a quotation or invoice line item. The item is "${productName}". Be concise, clear, and business-appropriate. For example, if the input is "web design", a good output would be "Comprehensive web design services including UI/UX, development, and deployment of a responsive website." Do not add any introductory text like "Here is a description:". Just provide the description itself.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
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
