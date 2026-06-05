import type { DetectionResult } from "../incidents";

export type OrdersAdvanceResult = {
  previous_cursor: string;
  cursor: string;
  at_end: boolean;
  breaches: DetectionResult;
};
