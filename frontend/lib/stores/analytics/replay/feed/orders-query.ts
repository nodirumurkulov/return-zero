import { z } from "zod";

export const ordersQuerySchema = z.object({
  after: z.string().min(1),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
