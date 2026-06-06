import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd());

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const authFile = "e2e/.auth/user.json";

const webServerEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "OPENAI_API_KEY",
  "LLM_PROVIDER",
] as const;

const webServerEnv = Object.fromEntries(
  webServerEnvKeys
    .filter((key) => process.env[key])
    .map((key) => [key, process.env[key] as string]),
);

export default defineConfig({
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: isCI
    ? [["github"], ["html", { outputFolder: "playwright-report", open: "never" }], ["blob"]]
    : [["list"]],
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
    env: webServerEnv,
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
      dependencies: ["setup"],
    },
  ],
});
