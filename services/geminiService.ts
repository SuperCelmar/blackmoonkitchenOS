import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    // Check if API key exists to avoid crash on init, though required by prompt rules to use process.env
    if(!process.env.API_KEY) {
        console.warn("API_KEY is missing. AI features will fail.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateMenuDescription = async (dishNameFR: string, dishNameCN: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Write a short, appetizing description (max 15 words) in French for a restaurant menu item. 
    The dish is: ${dishNameFR} (Chinese name: ${dishNameCN}). 
    Tone: Elegant and delicious. 
    Output ONLY the French description.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Description non disponible.";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "Délicieux plat maison aux saveurs authentiques."; // Fallback
  }
};
