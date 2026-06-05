import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/incidents", () => ({
  approveIncidentActions: vi.fn(),
  getIncident: vi.fn(),
  listLowRiskProposedActionIds: vi.fn(),
}));

vi.mock("@/lib/detection/recover", () => ({
  captureRecoveryBaseline: vi.fn(),
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
import {
  approveIncidentActions,
  getIncident,
  listLowRiskProposedActionIds,
} from "@/lib/incidents";

const listLowRiskMock = vi.mocked(listLowRiskProposedActionIds);
const approveMock = vi.mocked(approveIncidentActions);
const getIncidentMock = vi.mocked(getIncident);

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
    listLowRiskMock.mockResolvedValue(["a1"]);
    approveMock.mockResolvedValue({ approved: 1 });
    getIncidentMock.mockResolvedValue(
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

  it("approves low-risk actions for valid Slack interaction", async () => {
    const { body, timestamp, signature, secret } = signedBody({
      team: { id: "T123" },
      actions: [{ action_id: "approve_low_risk", value: "inc-1" }],
      user: { name: "slack-user" },
    });
    vi.stubEnv("SLACK_SIGNING_SECRET", secret);

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
    expect(approveMock).toHaveBeenCalledWith({}, "inc-1", ["a1"], null, { slack_user: "slack-user" });
  });
});
