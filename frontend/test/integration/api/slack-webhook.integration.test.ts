import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { incidentStoreMock } = vi.hoisted(() => ({
  incidentStoreMock: {
    approveAndNotify: vi.fn(),
    get: vi.fn(),
    listActions: vi.fn(),
  },
}));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({ incidents: incidentStoreMock })),
}));

vi.mock("@/lib/slack", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/slack")>();
  return {
    ...actual,
    sendIncidentNotification: vi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/organizations", () => ({
  resolveOrganizationIdForSlackTeam: vi.fn(async () => "org-1"),
}));

import { POST } from "@/app/api/slack/webhook/route";
import { createIncidentFixture } from "@/test/fixtures/incidents";
const listActionsMock = incidentStoreMock.listActions;
const approveMock = incidentStoreMock.approveAndNotify;
const getMock = incidentStoreMock.get;

function signedBody(payload: object, secret = "slack-signing-secret") {
  const rawPayload = JSON.stringify(payload);
  const body = `payload=${encodeURIComponent(rawPayload)}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature =
    "v0=" +
    createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex");
  return { body, timestamp, signature, secret };
}

describe("POST /api/slack/webhook", () => {
  beforeEach(() => {
    listActionsMock.mockResolvedValue(["a1"]);
    approveMock.mockResolvedValue({ approved: 1 });
    getMock.mockResolvedValue(
      createIncidentFixture({ id: "inc-1", organization_id: "org-1", product_id: null }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 when signature is invalid", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/slack/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-slack-signature": "v0=bad",
          "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
        },
        body: "payload=%7B%7D",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("approves low-risk actions when signature is valid", async () => {
    vi.stubEnv("SLACK_SIGNING_SECRET", "slack-signing-secret");
    const { body, timestamp, signature } = signedBody({
      team: { id: "T123" },
      user: { name: "tester" },
      actions: [{ action_id: "approve_low_risk", value: "inc-1" }],
    });

    const res = await POST(
      new NextRequest("http://localhost/api/slack/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-slack-signature": signature,
          "x-slack-request-timestamp": timestamp,
        },
        body,
      }),
    );
    expect(res.status).toBe(200);
    expect(approveMock).toHaveBeenCalled();
  });
});
