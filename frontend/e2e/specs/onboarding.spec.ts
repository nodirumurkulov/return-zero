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
});
