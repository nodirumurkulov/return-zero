import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { test as setup } from "@playwright/test";
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "./constants";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await mkdir(dirname(authFile), { recursive: true });

  await setup.step("Sign in", async () => {
    await page.goto("/sign-in");
    await page.locator("#auth-email").fill(E2E_USER_EMAIL);
    await page.locator("#auth-password").fill(E2E_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/catalog");
  });

  await page.context().storageState({ path: authFile });
});
