import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult } from "../types/plant";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const PLANT_ANALYSIS_PROMPT = `
Analyze the uploaded image for any plants. For each plant identified, provide:
1. Common Name and Scientific Name.
2. Health Score (0-100).
3. Health Status (Excellent, Good, Fair, Poor, Critical).
4. A brief clinical summary of the plant's current state.
5. Care tips for watering, light, and temperature.
6. List any visible symptoms if the plant is unhealthy.
7. Actionable recommendations for improvement.

Return the data in a structured JSON format.
`;

export async function analyzePlantImage(base64Image: string, mimeType: string, lang: 'zh' | 'en'): Promise<DetectionResult> {
  const languagePrompt = lang === 'zh' ? "Please provide ALL text fields (summary, care tips, recommendations, etc.) in Simplified Chinese." : "Please provide ALL text fields in English.";
  
  const PLANT_ANALYSIS_PROMPT = `
Identify ALL distinct plants in the uploaded image. If there are multiple different plants, list every one of them separately. 

IMPORTANT: If the image does NOT contain any plants, return an empty array for the "plants" field.

For EACH plant identified, provide:
1. Common Name and Scientific Name.
2. Health Score (0-100).
3. Health Status (Excellent, Good, Fair, Poor, Critical).
4. A brief clinical summary of the plant's current state.
5. Care tips for watering, light, and temperature.
6. List any visible symptoms if the plant is unhealthy.
7. Actionable recommendations for improvement.

${languagePrompt}
Return the data in a structured JSON format.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(",")[1] || base64Image,
              mimeType: mimeType,
            },
          },
          { text: PLANT_ANALYSIS_PROMPT },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  scientificName: { type: Type.STRING },
                  healthScore: { type: Type.NUMBER },
                  healthStatus: { 
                    type: Type.STRING,
                    enum: ["Excellent", "Good", "Fair", "Poor", "Critical"]
                  },
                  summary: { type: Type.STRING },
                  careTips: {
                    type: Type.OBJECT,
                    properties: {
                      watering: { type: Type.STRING },
                      light: { type: Type.STRING },
                      temperature: { type: Type.STRING },
                      notes: { type: Type.STRING }
                    },
                    required: ["watering", "light", "temperature", "notes"]
                  },
                  symptoms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["name", "healthScore", "healthStatus", "summary", "careTips", "recommendations"]
              }
            },
            overallSummary: { type: Type.STRING }
          },
          required: ["plants", "overallSummary"]
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as DetectionResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
}
