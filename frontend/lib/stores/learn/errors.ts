export class LearnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LearnError";
  }
}
