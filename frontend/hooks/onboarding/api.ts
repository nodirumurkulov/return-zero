import { z } from "zod";

const connectResultSchema = z.object({
  table: z.string(),
  count: z.number(),
  error: z.string().optional(),
});

const connectResponseSchema = z.union([
  z.object({ success: z.literal(true), results: z.array(connectResultSchema) }),
  z.object({ success: z.literal(false), results: z.array(connectResultSchema) }),
  z.object({ error: z.string() }),
]);

const learnResponseSchema = z.union([
  z.object({ success: z.literal(true) }),
  z.object({ success: z.literal(false), error: z.string() }),
  z.object({ error: z.string() }),
]);

export type PostConnectStoreResult = {
  readonly results: Array<{ table: string; count: number; error?: string }>;
};

async function parseConnectResponse(res: Response): Promise<PostConnectStoreResult> {
  const json: unknown = await res.json();
  const parsed = connectResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Connect failed");
  if ("error" in parsed.data) throw new Error(parsed.data.error);
  if (!parsed.data.success) throw new Error("Connect failed");
  return { results: parsed.data.results };
}

export async function postConnectMockStore(): Promise<PostConnectStoreResult> {
  const res = await fetch("/api/stores/connect/mock", { method: "POST" });
  return parseConnectResponse(res);
}

export async function postConnectShopifyStore(): Promise<PostConnectStoreResult> {
  const res = await fetch("/api/stores/connect/shopify", { method: "POST" });
  return parseConnectResponse(res);
}

export async function postLearn(): Promise<void> {
  const res = await fetch("/api/learn", { method: "POST" });
  const json: unknown = await res.json();
  const parsed = learnResponseSchema.safeParse(json);
  if (!res.ok || !parsed.success || !("success" in parsed.data && parsed.data.success)) {
    const message =
      parsed.success && "error" in parsed.data ? parsed.data.error : "Analysis failed";
    throw new Error(message);
  }
}
