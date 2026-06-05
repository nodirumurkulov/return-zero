import {
  MAIN_INCIDENT_ID,
  MAIN_INCIDENT_TITLE,
  SEEDED_INCIDENT_TITLES,
  STATUS_CHANGE_INCIDENT_TITLE,
} from "../constants";
import { expect, resetStatusChangeIncidentFixture, test } from "../fixtures";
import { IncidentsPage } from "../pages/incidents.page";

test.describe.configure({ mode: "serial" });

test.describe("Incidents board", () => {
  test.beforeEach(async ({ admin }) => {
    await resetStatusChangeIncidentFixture(admin);
  });
  test("shows all seeded incidents on the kanban", async ({ page }) => {
    const incidents = new IncidentsPage(page);
    await incidents.goto();
    await expect(incidents.heading()).toBeVisible();

    for (const title of SEEDED_INCIDENT_TITLES) {
      await expect(incidents.incidentLink(title)).toBeVisible();
    }
  });

  test("opens incident detail from a card", async ({ page }) => {
    const incidents = new IncidentsPage(page);
    await incidents.goto();
    await incidents.incidentLink(MAIN_INCIDENT_TITLE).click();
    await expect(page).toHaveURL(new RegExp(`/incidents/${MAIN_INCIDENT_ID}$`));
  });

  test("changes incident status from the kanban card", async ({ page }) => {
    const incidents = new IncidentsPage(page);
    await incidents.goto();

    await test.step("Move stockout incident to investigating", async () => {
      await incidents.changeStatus(STATUS_CHANGE_INCIDENT_TITLE, "Investigating");
    });

    await test.step("Status trigger reflects new value", async () => {
      const trigger = incidents.statusTriggerFor(STATUS_CHANGE_INCIDENT_TITLE);
      await expect(trigger).toContainText("Investigating");
    });
  });
});
