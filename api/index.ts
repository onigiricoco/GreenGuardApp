import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '20mb' }));

// Initialize Gemini AI (Only on server)
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

// API Route for Plant Analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { base64Image, mimeType, lang } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured on server." });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

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

    const response = await model.generateContent({
      contents: [{
        parts: [
          { inlineData: { data: base64Image.split(",")[1] || base64Image, mimeType } },
          { text: PLANT_ANALYSIS_PROMPT }
        ]
      }],
      generationConfig: {
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
      }
    });

    const result = JSON.parse(response.response.text());
    res.json(result);
  } catch (error) {
    console.error("Server Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze image." });
  }
});

// For local dev, we run Vite as middleware
if (process.env.NODE_ENV !== "production") {
  const startDev = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Dev server running at http://localhost:${PORT}`);
    });
  };
  startDev();
}

// Export the app for Vercel Serverless Functions
export default app;
