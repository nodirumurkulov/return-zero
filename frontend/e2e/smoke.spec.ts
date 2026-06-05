import { test, expect } from "@playwright/test";

test.describe("public routes", () => {
  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Resolve" })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
