import { expect, test } from "@playwright/test";
import { IncidentsPage } from "../pages/incidents.page";

test.describe("Replay control", () => {
  test("advances replay clock from incidents board", async ({ page }) => {
    const incidents = new IncidentsPage(page);
    await incidents.goto();

    const advance = page.getByRole("button", { name: "Advance 7 days" });
    await expect(advance).toBeVisible();
    await advance.click();
    await expect(advance).toHaveText(/Advancing…|Advance 7 days/, { timeout: 15_000 });
    await expect(page.getByText(/new incident|No new incidents|reached end of data/i)).toBeVisible({
      timeout: 20_000,
    });
  });
});
