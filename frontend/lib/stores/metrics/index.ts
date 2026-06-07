export {
  computeMetrics,
  computeMetricsDetailed,
  computeProductMetrics,
  metricStatusFor,
  type ComputeOpts,
  type EngineRun,
} from "./engine";
export type {
  Direction,
  MetricDefinition,
  MetricStatus,
  MetricValue,
  Operation,
  ThresholdOverride,
} from "./metric-definition";
export { getSourceFacts, type ProductSourceFacts, type SourceFactsOpts } from "./source-facts";
export { getMonthlySeries, getProductSeries, type MonthlyPoint, type SeriesOpts } from "./series";
export {
  formatProductDeepContext,
  getProductDeepContext,
  getProductMarketingContext,
  type ProductDeepContext,
  type ProductMarketingContext,
} from "./context";
export {
  confidenceFromN,
  confidenceInterval,
  isAnomalous,
  zScore,
  type Confidence,
  type ConfidenceInterval,
} from "./spc";
