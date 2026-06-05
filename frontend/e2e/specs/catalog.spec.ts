import { expect, test } from "@playwright/test";
import { COURT_TRAINER_TITLE } from "../constants";
import { CatalogPage } from "../pages/catalog.page";
import { ProductPage } from "../pages/product.page";

test.describe.configure({ mode: "serial" });

test.describe("Catalog", () => {
  test("lists seeded products and supports search", async ({ page }) => {
    const catalog = new CatalogPage(page);
    await catalog.goto();

    await expect(catalog.heading()).toBeVisible();
    await expect(catalog.productLink(COURT_TRAINER_TITLE)).toBeVisible();

    await catalog.searchFor("zzznomatch");
    await expect(catalog.productLink(COURT_TRAINER_TITLE)).toHaveCount(0);

    await catalog.searchFor("");
    await catalog.searchInput().clear();
    await catalog.searchFor("Court");
    await expect(catalog.productLink(COURT_TRAINER_TITLE)).toBeVisible();
  });

  test("opens product detail from the grid", async ({ page }) => {
    const catalog = new CatalogPage(page);
    await catalog.goto();
    await catalog.openProduct(COURT_TRAINER_TITLE);
    await expect(page).toHaveURL(/\/catalog\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: COURT_TRAINER_TITLE })).toBeVisible();
  });

  test("saves a KPI threshold override", async ({ page }) => {
    const catalog = new CatalogPage(page);
    const product = new ProductPage(page);

    await catalog.goto();
    await catalog.openProduct(COURT_TRAINER_TITLE);

    const input = product.returnRateThresholdInput();
    const original = await input.inputValue();
    const parsed = Number(original);
    const next = String(Math.round((parsed + 0.01) * 100) / 100);
    await product.saveReturnRateThreshold(next);
    await expect(product.savedMessage()).toBeVisible();
    await page.reload();
    await expect(input).toHaveValue(next);
    await product.saveReturnRateThreshold(original);
    await page.reload();
    await expect(input).toHaveValue(original);
  });
});
