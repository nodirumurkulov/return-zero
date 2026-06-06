import { z } from "zod";

import { apiClient } from "@/lib/api/client";
import {
  importImportingResponseSchema,
  importSkippedResponseSchema,
  type StorePlatform,
} from "@/lib/stores";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 300_000;

const importStatusResponseSchema = z.object({
  connection: z
    .object({
      platform: z.string(),
      status: z.string(),
      connected_at: z.string().nullable(),
    })
    .nullable(),
  productCount: z.number(),
});

export type PostImportStoreResult = {
  readonly importing?: true;
  readonly skipped?: true;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function pollImportReady(): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const raw: unknown = await apiClient("/api/stores/import/status", { method: "GET" });
    const parsed = importStatusResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("Import failed");
    }

    const { connection, productCount } = parsed.data;
    if (connection?.status === "error") {
      throw new Error("Import failed");
    }
    if (connection?.status === "connected" && productCount > 0) {
      return;
    }
    if (connection?.status === "importing" && productCount > 0) {
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Import timed out");
}

export async function postImportStore(platform: StorePlatform): Promise<PostImportStoreResult> {
  const res = await fetch(`/api/stores/import/${platform}`, { method: "POST" });
  const json: unknown = await res.json().catch(() => null);

  if (res.status === 202) {
    const importing = importImportingResponseSchema.safeParse(json);
    if (!importing.success) {
      throw new Error("Import failed");
    }
    await pollImportReady();
    return { importing: true };
  }

  if (res.status === 200) {
    const skipped = importSkippedResponseSchema.safeParse(json);
    if (skipped.success) {
      return { skipped: true };
    }
  }

  if (json && typeof json === "object" && "error" in json && typeof json.error === "string") {
    throw new Error(json.error);
  }

  throw new Error("Import failed");
}
