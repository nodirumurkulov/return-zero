import {
  importPartialResponseSchema,
  importResponseSchema,
  type StorePlatform,
} from "@/lib/stores";

export type PostImportStoreResult = {
  readonly results: Array<{ table: string; count: number; error?: string }>;
};

function formatImportFailure(
  results: Array<{ table: string; count: number; error?: string }>,
): string {
  const failed = results.filter((result) => result.error);
  if (failed.length === 0) return "Import failed";
  return `Import failed: ${failed.map((result) => `${result.table}: ${result.error}`).join("; ")}`;
}

async function parseImportResponse(res: Response): Promise<PostImportStoreResult> {
  const json: unknown = await res.json();
  const parsed = importResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Import failed");
  if ("error" in parsed.data) throw new Error(parsed.data.error);

  if (parsed.data.success) {
    return { results: parsed.data.results };
  }

  throw new Error(formatImportFailure(parsed.data.results));
}

async function parseImportHttpResponse(res: Response): Promise<PostImportStoreResult> {
  if (res.status === 207) {
    const json: unknown = await res.json();
    const partial = importPartialResponseSchema.safeParse(json);
    if (partial.success) {
      throw new Error(formatImportFailure(partial.data.results));
    }
    throw new Error("Import failed");
  }
  return parseImportResponse(res);
}

async function postImport(path: string): Promise<PostImportStoreResult> {
  const res = await fetch(path, { method: "POST" });
  if (!res.ok && res.status !== 207) {
    const json: unknown = await res.json().catch(() => null);
    const parsed = importResponseSchema.safeParse(json);
    if (parsed.success && "error" in parsed.data) {
      throw new Error(parsed.data.error);
    }
    throw new Error("Import failed");
  }
  return parseImportHttpResponse(res);
}

export async function postImportStore(platform: StorePlatform): Promise<PostImportStoreResult> {
  return postImport(`/api/stores/import/${platform}`);
}
