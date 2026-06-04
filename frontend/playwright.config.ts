import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const authFile = "e2e/.auth/user.json";

export default defineConfig({
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: isCI ? "retain-on-failure" : "off",
  },
  webServer: {
    command: isCI ? "bun run start" : "bun run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "setup",
      testDir: "./e2e",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      testDir: "./e2e/specs",
      use: { ...devices["Desktop Chrome"], storageState: authFile },
      dependencies: ["setup"],
      testIgnore: /auth\.spec\.ts/,
    },
    {
      name: "chromium-guest",
      testDir: "./e2e",
      testMatch: [/specs\/auth\.spec\.ts/, /smoke\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
