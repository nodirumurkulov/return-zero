import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/detection/recover", () => ({
  runRecovery: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

import { POST } from "@/app/api/recover/route";
import { runRecovery } from "@/lib/detection/recover";

const runRecoveryMock = vi.mocked(runRecovery);

describe("POST /api/recover", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    runRecoveryMock.mockResolvedValue({ monitored: 1, updated: 1, resolved: [] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects invalid advance_days body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/recover", {
        method: "POST",
        headers: {
          authorization: "Bearer cron-test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ advance_days: "seven" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(runRecoveryMock).not.toHaveBeenCalled();
  });

  it("delegates to runRecovery with parsed body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/recover", {
        method: "POST",
        headers: {
          authorization: "Bearer cron-test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ advance_days: 7 }),
      }),
    );
    expect(res.status).toBe(200);
    expect(runRecoveryMock).toHaveBeenCalledWith({}, { advanceDays: 7 });
  });
});
