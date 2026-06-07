import { test, expect } from "@playwright/test";

test.describe("public routes", () => {
  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Hugo" })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("landing page loads for unauthenticated visitors", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Incident.io");
    await expect(page.getByRole("heading", { name: "Join the waitlist" })).toBeVisible();
  });

  test("sign-up shows waitlist gate", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: "Early access only" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Join Waitlist" })).toBeVisible();
  });

  test("catalog redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("marketing routes load without auth", async ({ page }) => {
    await page.goto("/features");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Built for commerce");

    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1, name: "Early access" })).toBeVisible();

    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1, name: "Updates" })).toBeVisible();
  });

  test("waitlist pricing page requires token", async ({ page }) => {
    await page.goto("/waitlist/pricing");
    await expect(page.getByRole("heading", { name: "Link required" })).toBeVisible();
  });
});
