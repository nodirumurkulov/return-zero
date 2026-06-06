import { expect, test } from "@playwright/test";

import { OnboardingPage } from "../pages/onboarding.page";

test.describe("Onboarding connect", () => {
  test("shows connect page for signed-in user", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(onboarding.heading()).toBeVisible();
    await expect(onboarding.connectButton().or(onboarding.continueButton())).toBeVisible();
  });

  test("navigates to catalog from onboarding", async ({ page }) => {
    await page.route("**/api/stores/import/mock_csv", async (route) => {
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ importing: true }),
      });
    });

    await page.route("**/api/stores/import/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          connection: {
            platform: "mock_csv",
            status: "connected",
            connected_at: new Date().toISOString(),
          },
          productCount: 42,
        }),
      });
    });

    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    const connect = onboarding.connectButton();
    if (await connect.isVisible()) {
      await connect.click();
    } else {
      await onboarding.continueButton().click();
    }

    await expect(page).toHaveURL(/\/catalog$/, { timeout: 15_000 });
  });
});
