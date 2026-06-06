import { z } from "zod";

const apiErrorBodySchema = z.object({ error: z.string() });

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  static fromBody(status: number, body: unknown, fallback = "Request failed"): ApiError {
    const parsed = apiErrorBodySchema.safeParse(body);
    return new ApiError(status, parsed.success ? parsed.data.error : fallback);
  }
}

export function assertApiData<T>(data: T | undefined, error: unknown): T {
  if (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) throw error;
    throw new Error(typeof error === "string" ? error : "Request failed");
  }
  if (data === undefined) {
    throw new Error("No data in response");
  }
  return data;
}
