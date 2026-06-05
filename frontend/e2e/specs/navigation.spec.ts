import { expect, test } from "@playwright/test";
import { AppShellPage } from "../pages/app-shell.page";
import { CatalogPage } from "../pages/catalog.page";
import { IncidentsPage } from "../pages/incidents.page";

test.describe("Navigation", () => {
  test("root and dashboard redirect to catalog", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/catalog$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test("desktop sidebar collapse trigger is visible", async ({ page }) => {
    const shell = new AppShellPage(page);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/catalog");
    await expect(shell.sidebarToggleTrigger()).toBeVisible();
  });

  test("sidebar navigates between catalog and incidents", async ({ page }) => {
    const shell = new AppShellPage(page);
    const catalog = new CatalogPage(page);
    const incidents = new IncidentsPage(page);

    await catalog.goto();
    await expect(catalog.heading()).toBeVisible();

    await shell.goToIncidents();
    await expect(incidents.heading()).toBeVisible();

    await shell.goToCatalog();
    await expect(catalog.heading()).toBeVisible();
  });
});
