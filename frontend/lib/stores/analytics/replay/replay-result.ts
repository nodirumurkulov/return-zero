import type { DetectionResult, ForecastDetectionResult } from "@/lib/stores/incidents";

export interface ReplayResult {
  previous_cursor: string;
  cursor: string;
  at_end: boolean;
  breaches: DetectionResult;
  forecast: ForecastDetectionResult;
}
