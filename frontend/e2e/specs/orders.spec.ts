import { expect, test } from "@playwright/test";
import { OrdersPage } from "../pages/orders.page";

test.describe("Orders replay feed", () => {
  test("streams orders after Start", async ({ page }) => {
    const orders = new OrdersPage(page);
    await orders.goto();

    await expect(orders.heading()).toBeVisible();
    await expect(orders.startButton()).toBeVisible();
    await orders.startButton().click();

    await expect(orders.orderFeedRows().first()).toBeVisible({ timeout: 20_000 });
  });
});
