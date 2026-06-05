/** Stable demo data from `seed --full --e2e` and e2e/fixtures. */

export const E2E_USER_EMAIL =
  process.env.E2E_USER_EMAIL ?? "e2e@resolve.local";
export const E2E_USER_PASSWORD =
  process.env.E2E_USER_PASSWORD ?? "e2e-test-password-12";

export const COURT_TRAINER_TITLE = "Court Trainer";

export const MAIN_INCIDENT_ID = "00000000-0000-0000-0000-000000000001";
export const MAIN_INCIDENT_TITLE = "Court Trainer Return Spike";

export const STATUS_CHANGE_INCIDENT_ID =
  "00000000-0000-0000-0000-000000000003";
export const STATUS_CHANGE_INCIDENT_TITLE = "Court Trainer UK11/UK12 Stockout";

export const E2E_DETECTED_INCIDENT_ID =
  "00000000-0000-0000-0000-000000000099";
export const E2E_DETECTED_INCIDENT_TITLE = "E2E Detected Incident";

/** Demo org from scripts/seed.ts (store + incidents from seed --full --e2e). */
export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000100";

/** First Pretty Fly trainer external id (uuid resolved at runtime). */
export const COURT_TRAINER_PRODUCT_EXTERNAL_ID = "prod_00005";

export const SEEDED_INCIDENT_TITLES = [
  MAIN_INCIDENT_TITLE,
  "Wasted Ad Spend — Low-ROAS Campaigns",
  STATUS_CHANGE_INCIDENT_TITLE,
  "M3 Customer Retention at 9.5%",
] as const;
