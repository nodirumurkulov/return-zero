import type { NextRequest } from "next/server";

/** Parse a JSON string; returns null if invalid. */
export function parseJsonString<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Parse JSON body when present; returns undefined if body is empty or invalid. */
export async function readOptionalJson<T>(req: NextRequest): Promise<T | undefined> {
  try {
    return (await req.json()) as T;
  } catch {
    return undefined;
  }
}

export async function readAdvanceDays(req: NextRequest): Promise<number | undefined> {
  const body = await readOptionalJson<{ advance_days?: number }>(req);
  return typeof body?.advance_days === "number" ? body.advance_days : undefined;
}
