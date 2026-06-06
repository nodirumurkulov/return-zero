import { z } from "zod";

import type { StoreScope } from "@/lib/tenancy/types";

import type { DetectionResult } from "../incidents/types";

export interface OrderFeedLineItem {
  title: string;
  quantity: number;
  price: number;
}

export interface OrderFeedItem {
  order_id: string;
  order_number: string | null;
  created_at: string;
  total_price: number;
  financial_status: string | null;
  utm_campaign: string | null;
  country: string | null;
  items: OrderFeedLineItem[];
}

export const ordersQuerySchema = z.object({
  after: z.string().min(1),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

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
    recovered: z.number().optional(),
    recovery_milestones: z.number().optional(),
    breaches: detectionResultSchema.optional(),
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

export type OrdersAdvanceResult = {
  previous_cursor: string;
  cursor: string;
  at_end: boolean;
  breaches: DetectionResult;
};

export type OrdersListOpts = {
  scope: StoreScope;
  after: string;
  limit?: number;
};

export type OrdersAdvanceOpts = {
  scope: StoreScope;
  days?: number;
};

export type OrdersBoundsOpts = {
  scope: StoreScope;
};

export type OrdersResetOpts = {
  scope: StoreScope;
};
