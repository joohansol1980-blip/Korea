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
      contents: `Extract the name and the memo content from this text: "${rawText}".
      Rules:
      - If there is a number before the name (e.g., "3333 김진료 도수대기" or "2343/주한솔 충격파"), include the number as part of the name (e.g., name: "3333 김진료").
      - The separator between number and name can be a space or "/".
      - If the text is just a name (with or without number), assume the memo content is "접수/대기".
      - The output must be JSON with keys 'name' and 'treatment' (where 'treatment' holds the memo content).`,
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