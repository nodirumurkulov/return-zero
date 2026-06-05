export class IncidentsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncidentsError";
  }
}
