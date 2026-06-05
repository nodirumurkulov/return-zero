import type { Page } from "@playwright/test";

export class OrdersPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/orders");
    await this.page.waitForURL("**/orders");
  }

  heading() {
    return this.page.getByRole("heading", { name: "Orders" });
  }

  startButton() {
    return this.page.getByRole("button", { name: "Start" });
  }

  orderFeedRows() {
    return this.page.getByTestId("order-feed-row");
  }
}
