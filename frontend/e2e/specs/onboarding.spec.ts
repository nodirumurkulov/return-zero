import { expect, test } from "@playwright/test";

test.describe("Onboarding upload", () => {
  test("shows analysis results after mocked upload", async ({ page }) => {
    await page.route("**/api/onboarding/upload", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          results: [{ table: "products", count: 12 }],
        }),
      });
    });

    await page.route("**/api/learn", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/onboarding");
    await expect(page.getByRole("button", { name: "Upload & analyse" })).toBeVisible();
    await page.getByRole("button", { name: "Upload & analyse" }).click();
    await expect(page).toHaveURL(/\/onboarding\/report$/, { timeout: 15_000 });
  });
});
