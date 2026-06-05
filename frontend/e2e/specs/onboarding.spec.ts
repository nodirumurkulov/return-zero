import { expect, test } from "@playwright/test";
import { OnboardingPage } from "../pages/onboarding.page";

test.describe("Onboarding upload", () => {
  test("shows upload UI and seeded product count", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(onboarding.heading()).toBeVisible();
    await expect(onboarding.uploadButton()).toBeVisible();
    await expect(onboarding.seededProductBanner(62)).toBeVisible();
  });

  test("redirects to report after mocked upload and learn", async ({ page }) => {
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

    const onboarding = new OnboardingPage(page);
    await onboarding.goto();
    await onboarding.uploadButton().click();
    await expect(page).toHaveURL(/\/onboarding\/report$/, { timeout: 15_000 });
  });
});
