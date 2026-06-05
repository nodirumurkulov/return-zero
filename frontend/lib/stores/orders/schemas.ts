import { z } from "zod";

export const advanceBodySchema = z.object({
  advance_days: z.number().finite().positive().optional(),
  reset: z.boolean().optional(),
});

export type AdvanceBody = z.infer<typeof advanceBodySchema>;

const createdIncidentSchema = z.object({
  incident_id: z.string(),
  title: z.string(),
  severity: z.string(),
  impact_amount: z.number().nullable(),
  impact_label: z.string().nullable(),
});

const detectionResultSchema = z.object({
  created: z.array(createdIncidentSchema),
});

export const advanceResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    reset: z.literal(true).optional(),
    cursor: z.string().nullable(),
    previous_cursor: z.string().nullable(),
    at_end: z.boolean(),
    created: z.number(),
  }),
  z.object({
    success: z.literal(true),
    cursor: z.string().nullable(),
    previous_cursor: z.string().nullable(),
    at_end: z.boolean(),
    created: z.number(),
    breaches: detectionResultSchema.optional(),
    forecast: detectionResultSchema.optional(),
  }),
  z.object({ error: z.string() }),
]);

export const feedResponseSchema = z.union([
  z.object({
    orders: z.array(
      z.object({
        order_id: z.string(),
        order_number: z.string().nullable(),
        created_at: z.string(),
        total_price: z.number(),
        financial_status: z.string().nullable(),
        utm_campaign: z.string().nullable(),
        country: z.string().nullable(),
        items: z.array(
          z.object({
            title: z.string(),
            quantity: z.number(),
            price: z.number(),
          }),
        ),
      }),
    ),
    cursor: z.string().nullable(),
    data_end: z.string().nullable(),
  }),
  z.object({ error: z.string() }),
]);

export type AdvanceResponse = z.infer<typeof advanceResponseSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
