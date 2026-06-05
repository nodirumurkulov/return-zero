import { expect, test } from "@playwright/test";

import { OnboardingPage } from "../pages/onboarding.page";

test.describe("Onboarding connect", () => {
  test("shows store choice UI", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(onboarding.heading()).toBeVisible();
    await expect(onboarding.connectButton()).toBeVisible();
  });

  test("redirects to report after mocked connect and learn", async ({ page }) => {
    await page.route("**/api/stores/connect/mock", async (route) => {
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
    await onboarding.connectButton().click();
    await expect(page).toHaveURL(/\/onboarding\/report$/, { timeout: 15_000 });
  });
});
