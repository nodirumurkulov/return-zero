import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { incidentStoreMock } = vi.hoisted(() => ({
  incidentStoreMock: {
    get: vi.fn(),
    listActionIds: vi.fn(() => Promise.resolve(["a1"])),
    approveAndNotify: vi.fn(),
  },
}));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({ incidents: incidentStoreMock })),
}));

vi.mock("@/lib/hugo/actions", () => ({
  runHugoRejectProposedActions: vi.fn(),
  runHugoResolve: vi.fn(),
}));

vi.mock("@/lib/slack", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    sendIncidentNotification: vi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/tenancy/server", () => ({
  resolveOrganizationIdForSlackTeam: vi.fn(() => Promise.resolve("org-1")),
  getTenancy: vi.fn(() => ({
    getStoreScope: vi.fn(() =>
      Promise.resolve({ organizationId: "org-1", storeId: "store-1" }),
    ),
  })),
}));

import { POST } from "@/app/api/slack/webhook/route";
import { runHugoRejectProposedActions, runHugoResolve } from "@/lib/hugo/actions";
import { createIncidentFixture } from "@/test/fixtures/incidents";

const getMock = incidentStoreMock.get;
const approveMock = incidentStoreMock.approveAndNotify;
const resolveMock = vi.mocked(runHugoResolve);
const rejectMock = vi.mocked(runHugoRejectProposedActions);

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
    approveMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue(
      createIncidentFixture({ id: "inc-1", organization_id: "org-1", product_id: null }),
    );
    resolveMock.mockResolvedValue("Resolved incident");
    rejectMock.mockResolvedValue("Rejected fixes");
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

  it("resolves incidents after Slack confirmation", async () => {
    const { body, timestamp, signature, secret } = signedBody({
      team: { id: "T123" },
      actions: [{ action_id: "confirm_hugo_resolve", value: "inc-1" }],
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
    expect(resolveMock).toHaveBeenCalledWith({}, expect.objectContaining({ id: "inc-1" }), {
      slack_user: "slack-user",
    });
    await expect(res.json()).resolves.toEqual({ text: "Resolved incident" });
  });

  it("rejects proposed fixes after Slack confirmation", async () => {
    const { body, timestamp, signature, secret } = signedBody({
      team: { id: "T123" },
      actions: [{ action_id: "confirm_hugo_reject", value: "inc-1" }],
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
    expect(rejectMock).toHaveBeenCalledWith({}, expect.objectContaining({ id: "inc-1" }), {
      slack_user: "slack-user",
    });
    await expect(res.json()).resolves.toEqual({ text: "Rejected fixes" });
  });
});
