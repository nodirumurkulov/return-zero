import { z } from "zod";

/** POST /api/stores/learn accepts an empty JSON object (or no body). */
export const learnBodySchema = z.object({}).strict();

export type LearnBody = z.infer<typeof learnBodySchema>;

export const learnResponseSchema = z.union([
  z.object({ success: z.literal(true) }).strict(),
  z.object({ success: z.literal(false), error: z.string() }).strict(),
  z.object({ error: z.string() }).strict(),
]);

const topProductSchema = z.object({
  product_id: z.string(),
  title: z.string(),
  value: z.number(),
});

const riskNowSchema = z.object({
  product_id: z.string(),
  title: z.string(),
  metric_key: z.string(),
  display_name: z.string(),
  value: z.number().nullable(),
  threshold: z.number(),
  severity: z.string(),
});

const learnedPatternSchema = z.object({
  metric_key: z.string(),
  display_name: z.string(),
  avg_mean: z.number(),
  avg_threshold: z.number(),
  products: z.number(),
});

/** Parsed from business_reports.summary jsonb. */
export const reportSummarySchema = z.object({
  generated_window_days: z.number(),
  totals: z.object({
    revenue_lifetime: z.number(),
    orders: z.number(),
    aov: z.number(),
    refund_rate: z.number(),
    return_rate: z.number(),
    support_volume: z.number(),
    products: z.number(),
    skus: z.number(),
    breaches_now: z.number(),
  }),
  trend: z.object({
    months: z.array(z.string()),
    revenue: z.array(z.number()),
    refund_rate: z.array(z.number()),
    revenue_direction: z.enum(["rising", "falling", "stable"]),
    peak_revenue_month: z.string().nullable(),
  }),
  top: z.object({
    by_revenue: z.array(topProductSchema),
    worst_refund_rate: z.array(topProductSchema),
    worst_roas: z.array(topProductSchema),
  }),
  risks_now: z.array(riskNowSchema),
  learned: z.array(learnedPatternSchema),
});

export type ReportSummary = z.infer<typeof reportSummarySchema>;

export function parseReportSummary(value: unknown): ReportSummary | null {
  const parsed = reportSummarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export interface LearnResult {
  baselines: number;
  thresholds: number;
  products: number;
}

export type LearnRunOpts = {
  organizationId: string;
};

export type LearnRunResult = {
  learn: LearnResult;
  reportId: string;
  replayCursor: string;
};

export type BusinessReport = {
  id: string;
  summary: ReportSummary;
  narrative: string;
  created_at: string;
};
