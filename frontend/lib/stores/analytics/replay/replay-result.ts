import type { DetectionResult } from "@/lib/detection/detect";
import type { ForecastDetectionResult } from "@/lib/detection/forecast";

export interface ReplayResult {
  previous_cursor: string;
  cursor: string;
  at_end: boolean;
  breaches: DetectionResult;
  forecast: ForecastDetectionResult;
}
