import { expect, test } from "@playwright/test";
import { IncidentsPage } from "../pages/incidents.page";

test.describe("Replay control", () => {
  test("advances replay clock from incidents board", async ({ page }) => {
    await page.route("**/api/stores/orders/advance", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          cursor: "2024-02-01",
          previous_cursor: "2024-01-25",
          created: 0,
          at_end: false,
        }),
      });
    });

    const incidents = new IncidentsPage(page);
    await incidents.goto();

    const advance = page.getByRole("button", { name: "Advance 7 days" });
    await expect(advance).toBeVisible();
    await advance.click();
    await expect(page.getByTestId("replay-status")).toHaveText("No new incidents this step", {
      timeout: 20_000,
    });
    await expect(advance).toHaveText("Advance 7 days", { timeout: 15_000 });
  });
});
