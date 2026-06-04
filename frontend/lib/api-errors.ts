import { NextResponse } from "next/server";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export function apiErrorResponse(err: unknown, status = 500): NextResponse {
  if (process.env.NODE_ENV !== "production" && err instanceof Error) {
    return NextResponse.json({ error: err.message }, { status });
  }
  return NextResponse.json({ error: GENERIC_MESSAGE }, { status });
}

export function logApiError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${context}]`, message);
}
