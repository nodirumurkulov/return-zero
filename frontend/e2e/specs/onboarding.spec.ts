import { expect, test } from "@playwright/test";

import { OnboardingPage } from "../pages/onboarding.page";

test.describe("Onboarding connect", () => {
  test("shows store choice UI", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(onboarding.heading()).toBeVisible();
    await expect(onboarding.connectButton()).toBeVisible();
  });

  test("redirects to report after mocked connect, profile, and learn", async ({ page }) => {
    await page.route("**/api/onboarding/connect", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          results: [{ table: "products", count: 12 }],
        }),
      });
    });

    await page.route("**/api/onboarding/profile", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            profile: {
              platform: "shopify",
              storeName: "Demo Store",
              primaryGoal: "growth",
              targetMarginPct: 55,
              minRoas: 3,
              leadTimeDays: 71,
              bufferDays: 14,
              heroProductIds: [],
            },
            productCosts: [],
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
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
    await expect(onboarding.profileSaveButton()).toBeVisible({ timeout: 15_000 });
    await onboarding.profileSaveButton().click();
    await expect(page).toHaveURL(/\/onboarding\/report$/, { timeout: 15_000 });
  });
});
