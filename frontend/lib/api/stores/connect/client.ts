import {
  connectPartialResponseSchema,
  connectResponseSchema,
} from "@/lib/stores/connect/schemas";

export type PostConnectStoreResult = {
  readonly results: Array<{ table: string; count: number; error?: string }>;
};

function formatConnectFailure(
  results: Array<{ table: string; count: number; error?: string }>,
): string {
  const failed = results.filter((result) => result.error);
  if (failed.length === 0) return "Connect failed";
  return `Connect failed: ${failed.map((result) => `${result.table}: ${result.error}`).join("; ")}`;
}

async function parseConnectResponse(res: Response): Promise<PostConnectStoreResult> {
  const json: unknown = await res.json();
  const parsed = connectResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Connect failed");
  if ("error" in parsed.data) throw new Error(parsed.data.error);

  if (parsed.data.success) {
    return { results: parsed.data.results };
  }

  throw new Error(formatConnectFailure(parsed.data.results));
}

async function parseConnectHttpResponse(res: Response): Promise<PostConnectStoreResult> {
  if (res.status === 207) {
    const json: unknown = await res.json();
    const partial = connectPartialResponseSchema.safeParse(json);
    if (partial.success) {
      throw new Error(formatConnectFailure(partial.data.results));
    }
    throw new Error("Connect failed");
  }
  return parseConnectResponse(res);
}

async function postConnect(path: string): Promise<PostConnectStoreResult> {
  const res = await fetch(path, { method: "POST" });
  if (!res.ok && res.status !== 207) {
    const json: unknown = await res.json().catch(() => null);
    const parsed = connectResponseSchema.safeParse(json);
    if (parsed.success && "error" in parsed.data) {
      throw new Error(parsed.data.error);
    }
    throw new Error("Connect failed");
  }
  return parseConnectHttpResponse(res);
}

export async function postConnectMockStore(): Promise<PostConnectStoreResult> {
  return postConnect("/api/stores/connect/mock");
}

export async function postConnectShopifyStore(): Promise<PostConnectStoreResult> {
  return postConnect("/api/stores/connect/shopify");
}
