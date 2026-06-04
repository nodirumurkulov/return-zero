// Forecasting — shared types. Deterministic, explainable outputs (math computes,
// the LLM only narrates). A Python service (RUN-66) can later swap in behind the
// same shapes for stronger models.

export interface PointForecast {
  point: number; // central forecast
  lower: number; // ~95% lower band
  upper: number; // ~95% upper band
  horizon: number; // steps ahead (months) the forecast is for
  slope: number; // trend per step (sign = direction)
  method: string; // which method produced it (transparency)
  rising: boolean; // slope > 0
}

export interface StockoutForecast {
  days_to_stockout: number; // Infinity if no decline / no demand
  daily_demand: number;
  current_units: number;
  reorder_urgent: boolean; // stockout within lead+buffer
  stockout_within_lead: boolean; // stockout before a reorder could arrive
  method: string;
}
