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
      contents: `Extract the patient name and the treatment details from this text: "${rawText}". 
      If the text is just a name, assume treatment is "Consultation". 
      The output must be JSON.`,
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