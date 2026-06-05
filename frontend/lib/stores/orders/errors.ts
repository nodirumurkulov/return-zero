export class OrdersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrdersError";
  }
}
