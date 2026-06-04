import type { NextRequest } from "next/server";
import type { input, output, ZodError, ZodType } from "zod";

export type ParseJsonResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ") || "Invalid request body";
}

/** Parse JSON request body with Zod. Uses `fallback` when body is missing or invalid JSON. */
export async function parseRequestJson<T extends ZodType>(
  req: NextRequest,
  schema: T,
  fallback: input<T> = {} as input<T>,
): Promise<ParseJsonResult<output<T>>> {
  const raw = await req.json().catch(() => fallback);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  return { success: true, data: parsed.data };
}
