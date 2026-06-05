import { expect, test } from "@playwright/test";

test.describe("Orders replay feed", () => {
  test("navigates from sidebar and starts the stream", async ({ page }) => {
    await page.goto("/catalog");
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByText("Live")).toBeVisible({ timeout: 15_000 });
  });
});
