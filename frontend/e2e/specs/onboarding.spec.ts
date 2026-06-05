import { expect, test } from "@playwright/test";

test.describe("Onboarding upload", () => {
  test("shows analysis results after mocked upload", async ({ page }) => {
    await page.route("**/api/onboarding/upload", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [{ table: "products", count: 12 }],
        }),
      });
    });

    await page.goto("/onboarding");
    await expect(page.getByRole("button", { name: "Upload & analyse" })).toBeVisible();
    await page.getByRole("button", { name: "Upload & analyse" }).click();
    await expect(page.getByText("products")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("12")).toBeVisible();
  });
});
