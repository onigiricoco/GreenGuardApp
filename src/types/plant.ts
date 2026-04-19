export interface PlantAssessment {
  name: string;
  scientificName?: string;
  healthScore: number; // 0-100
  healthStatus: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  summary: string;
  careTips: {
    watering: string;
    light: string;
    temperature: string;
    notes: string;
  };
  symptoms?: string[];
  recommendations: string[];
}

export interface DetectionResult {
  plants: PlantAssessment[];
  overallSummary: string;
}
