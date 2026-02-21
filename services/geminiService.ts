import { GoogleGenAI, Type } from "@google/genai";

export const parseTreatmentText = async (
  rawText: string, 
  apiKey: string
): Promise<{ name: string; treatment: string } | null> => {
  if (!apiKey || !rawText.trim()) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the name and the memo content (e.g., treatment, schedule change, message) from this text: "${rawText}". 
      If the text is just a name, assume the memo content is "접수/대기".
      The output must be JSON with keys 'name' and 'treatment' (where 'treatment' holds the memo content).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            treatment: { type: Type.STRING }
          },
          required: ["name", "treatment"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Gemini parsing error:", error);
    return null;
  }
};