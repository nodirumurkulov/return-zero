import { expect, test } from "@playwright/test";
import {
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
} from "../constants";
import { AppShellPage } from "../pages/app-shell.page";
import { SignInPage } from "../pages/sign-in.page";

test.describe.configure({ mode: "serial" });

test.describe("Authentication", () => {
  test("redirects unauthenticated catalog visits to sign-in", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fcatalog/);
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.goto();
    await signIn.signIn(E2E_USER_EMAIL, "wrong-password-99");
    await expect(signIn.errorAlert()).toBeVisible();
  });

  test("sign-up page shows waitlist gate", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: "Early access only" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Join Waitlist" })).toHaveAttribute("href", "/#waitlist");
  });

  test("signs in and honors next redirect", async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.goto("/incidents");
    await signIn.signIn(E2E_USER_EMAIL, E2E_USER_PASSWORD);
    await expect(page).toHaveURL(/\/incidents$/);
  });

  test("sign out returns to sign-in and blocks catalog", async ({ page }) => {
    const signIn = new SignInPage(page);
    const shell = new AppShellPage(page);

    await signIn.goto();
    await signIn.signIn(E2E_USER_EMAIL, E2E_USER_PASSWORD);
    await expect(page).toHaveURL(/\/catalog$/);

    await shell.signOut();
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.goto("/catalog");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
