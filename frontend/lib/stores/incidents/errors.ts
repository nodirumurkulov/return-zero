export class IncidentsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncidentsError";
  }
}

export function assertNoSupabaseError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error) {
    throw new IncidentsError(`${context}: ${error.message}`);
  }
}
