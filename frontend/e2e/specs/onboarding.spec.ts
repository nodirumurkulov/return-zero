import { expect, test } from "@playwright/test";

import { OnboardingPage } from "../pages/onboarding.page";

test.describe("Onboarding analyze", () => {
  test("shows analyze UI for provisioned store", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(onboarding.heading()).toBeVisible();
    await expect(onboarding.runAnalysisButton()).toBeVisible();
  });

  test("redirects to report after mocked learn", async ({ page }) => {
    await page.route("**/api/learn", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const onboarding = new OnboardingPage(page);
    await onboarding.goto();
    await onboarding.runAnalysisButton().click();
    await expect(page).toHaveURL(/\/onboarding\/report$/, { timeout: 15_000 });
  });
});
