import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/detection/detect", () => ({
  detectBreaches: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

vi.mock("@/lib/organizations", () => ({
  listAllOrganizationIds: vi.fn(async () => ["org-1"]),
  requireOrganizationId: vi.fn(async () => "org-1"),
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
          affected_kpi_keys: ["stock"],
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

  it("returns 401 without session when CRON_SECRET is unset in development", async () => {
    vi.stubEnv("CRON_SECRET", "");
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
