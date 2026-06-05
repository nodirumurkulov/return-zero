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

export type PostConnectStoreInput = {
  readonly platform: "mock_csv" | "shopify";
};

export type PostConnectStoreResult = {
  readonly results: Array<{ table: string; count: number; error?: string }>;
};

export async function postConnectStore(input: PostConnectStoreInput): Promise<PostConnectStoreResult> {
  const res = await fetch("/api/onboarding/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json: unknown = await res.json();
  const parsed = connectResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Connect failed");
  if ("error" in parsed.data) throw new Error(parsed.data.error);
  if (!parsed.data.success) throw new Error("Connect failed");
  return { results: parsed.data.results };
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
