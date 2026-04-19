import { DetectionResult } from "../types/plant";

export async function analyzePlantImage(base64Image: string, mimeType: string, lang: 'zh' | 'en'): Promise<DetectionResult> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Image,
        mimeType,
        lang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze image");
    }

    return await response.json();
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error instanceof Error ? error : new Error("Failed to analyze image. Please try again.");
  }
}
