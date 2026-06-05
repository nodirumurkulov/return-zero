import { expect, test } from "@playwright/test";
import { MAIN_INCIDENT_TITLE } from "../constants";
import { IncidentsPage } from "../pages/incidents.page";
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

  test("navigates from sidebar", async ({ page }) => {
    await page.goto("/catalog");
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
  });

  test("replay start then incidents board stays reachable", async ({ page }) => {
    const orders = new OrdersPage(page);
    await orders.goto();
    await orders.startButton().click();
    await expect(orders.orderFeedRows().first()).toBeVisible({ timeout: 20_000 });

    const incidents = new IncidentsPage(page);
    await incidents.goto();
    await expect(incidents.heading()).toBeVisible();
    await expect(incidents.incidentLink(MAIN_INCIDENT_TITLE)).toBeVisible();
  });
});
