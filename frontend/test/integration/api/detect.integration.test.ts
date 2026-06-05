import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/detection/detect", () => ({
  detectBreaches: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/tenant/owner-user-ids", () => ({
  listOwnerUserIds: vi.fn(async () => ["owner-1"]),
}));

import { POST } from "@/app/api/detect/route";
import { detectBreaches } from "@/lib/detection/detect";

const detectBreachesMock = vi.mocked(detectBreaches);

describe("POST /api/detect", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    detectBreachesMock.mockResolvedValue({
      scanned: 3,
      created: [
        {
          incident_id: "inc-1",
          product_id: "prod-1",
          title: "Test",
          severity: "high",
          affected_kpis: ["stock"],
          impact_amount: 1000,
        },
      ],
      skipped: [],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 without cron credentials when secret is set", async () => {
    const res = await POST(new NextRequest("http://localhost/api/detect", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(detectBreachesMock).not.toHaveBeenCalled();
  });

  it("runs detection when cron auth is valid", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/detect", {
        method: "POST",
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; created: number };
    expect(json.success).toBe(true);
    expect(json.created).toBe(1);
    expect(detectBreachesMock).toHaveBeenCalled();
  });
});
