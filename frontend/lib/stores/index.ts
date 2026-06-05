export type {
  CatalogForecastOpts,
  CatalogGetOpts,
  CatalogHealthOpts,
  CatalogInclude,
  CatalogListOpts,
  CatalogUpdateOpts,
  HealthLevel,
  KpiThreshold,
  ProductMetric,
  ProductMonthlyMetric,
} from "./catalog/types";
export { updateThresholdBodySchema, updateThresholdResponseSchema, type UpdateThresholdBody } from "./catalog/schemas";
export { computeHealthLevel, computeProductHealth } from "./catalog/health";
export type { ProductForecast } from "./catalog/forecast/product";
export type { MarginBridgeInput, MarginDriver } from "./catalog/forecast/margin";
export type { ReorderPlan } from "./catalog/forecast/reorder";

export type { OrderFeedItem, OrderFeedLineItem } from "./orders/feed/order-feed-item";
export { ordersQuerySchema, type OrdersQuery } from "./orders/feed/orders-query";
export {
  advanceBodySchema,
  advanceResponseSchema,
  feedResponseSchema,
  type AdvanceBody,
  type AdvanceResponse,
  type FeedResponse,
} from "./orders/schemas";

export type {
  AgentFinding,
  ApproveActionsInput,
  ApproveIncidentAndNotifyOpts,
  Incident,
  IncidentAction,
  IncidentDetail,
  IncidentRef,
  IncidentsGetOpts,
  IncidentsListOpts,
  IncidentsUpdateOpts,
  ListIncidentActionIdsOpts,
  TimelineEvent,
} from "./incidents/types";
export type { DetectOpts, DetectionResult, CreatedIncident } from "./incidents/detect";
export {
  approveIncidentBodySchema,
  approveIncidentResponseSchema,
  incidentDetailSchema,
  patchIncidentStatusBodySchema,
  updateIncidentBodySchema,
  type ApproveIncidentBody,
  type ApproveIncidentResponse,
  type PatchIncidentStatusBody,
  type UpdateIncidentBody,
} from "./incidents/schemas";
export { INCIDENT_STATUSES, KANBAN_COLUMNS } from "./incidents/status";

export {
  learnBodySchema,
  learnResponseSchema,
  parseReportSummary,
  type LearnBody,
  type ReportSummary,
} from "./learn/schemas";
export type { LearnResult } from "./learn/baselines";
export type { LearnRunOpts, LearnRunResult } from "./learn/learn";

export type { SearchListOpts } from "./search/search";
export type { SearchTarget } from "./search/types";

export { forecastStockout } from "./catalog/forecast/predictors";

export type { StoreConnection, StorePlatform } from "./import";
export {
  importPartialResponseSchema,
  importResponseSchema,
  importResultSchema,
  importSuccessResponseSchema,
  storePlatformSchema,
  type ImportResponse,
} from "./import";
