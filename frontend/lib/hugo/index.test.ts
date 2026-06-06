import { beforeEach, describe, expect, it, vi } from "vitest";

import { createIncidentFixture } from "@/test/fixtures/incidents";

const {
  authorizeSlackActionMock,
  classifyHugoIntentMock,
  fetchSlackThreadMessagesMock,
  generateChatReplyMock,
  generateDataReplyMock,
  incidentStoreMock,
  postSlackMessageMock,
  runHugoApprovalMock,
} = vi.hoisted(() => ({
  authorizeSlackActionMock: vi.fn(),
  classifyHugoIntentMock: vi.fn(),
  fetchSlackThreadMessagesMock: vi.fn(),
  generateChatReplyMock: vi.fn(),
  generateDataReplyMock: vi.fn(),
  incidentStoreMock: {
    getDetail: vi.fn(),
    list: vi.fn(),
  },
  postSlackMessageMock: vi.fn(),
  runHugoApprovalMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/slack", () => ({
  fetchSlackThreadMessages: fetchSlackThreadMessagesMock,
  postSlackMessage: postSlackMessageMock,
}));

vi.mock("@/lib/slack-auth/authorize", () => ({
  authorizeSlackAction: authorizeSlackActionMock,
}));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({ incidents: incidentStoreMock })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/tenancy/server", () => ({
  getTenancy: vi.fn(() => ({
    getStoreScope: vi.fn(() =>
      Promise.resolve({ organizationId: "org-1", storeId: "store-1" }),
    ),
  })),
  resolveOrganizationIdForSlackTeam: vi.fn(() => Promise.resolve("org-1")),
}));

vi.mock("./actions", () => ({
  runHugoApproval: runHugoApprovalMock,
  runHugoInvestigation: vi.fn(),
  runHugoReopen: vi.fn(),
  runHugoSnooze: vi.fn(),
}));

vi.mock("./intent", () => ({
  classifyHugoIntent: classifyHugoIntentMock,
}));

vi.mock("./reply", () => ({
  generateChatReply: generateChatReplyMock,
  generateDataReply: generateDataReplyMock,
}));

import { handleHugoMention, needsThreadHistory } from "./index";

describe("needsThreadHistory", () => {
  it("requires history for short ambiguous follow-ups", () => {
    expect(needsThreadHistory("resolve this")).toBe(true);
    expect(needsThreadHistory("investigate the second one")).toBe(true);
    expect(needsThreadHistory("approve it")).toBe(true);
  });

  it("does not require history for long self-contained prompts that include this", () => {
    expect(
      needsThreadHistory(
        "make a plan to resolve this refund-rate incident: refund rate target is 8 percent and puffer jacket is at 26 percent",
      ),
    ).toBe(false);
  });
});

describe("handleHugoMention", () => {
  beforeEach(() => {
    authorizeSlackActionMock.mockReset();
    classifyHugoIntentMock.mockReset();
    fetchSlackThreadMessagesMock.mockReset();
    generateChatReplyMock.mockReset();
    generateDataReplyMock.mockReset();
    incidentStoreMock.getDetail.mockReset();
    incidentStoreMock.list.mockReset();
    postSlackMessageMock.mockReset();
    runHugoApprovalMock.mockReset();

    authorizeSlackActionMock.mockResolvedValue({ allowed: true, userId: "user-1", role: "owner" });
    fetchSlackThreadMessagesMock.mockResolvedValue({ ok: true, messages: [] });
    generateChatReplyMock.mockResolvedValue("chat reply");
    generateDataReplyMock.mockResolvedValue("data reply");
    incidentStoreMock.list.mockResolvedValue([]);
    runHugoApprovalMock.mockResolvedValue("approved fixes");
  });

  it("answers data queries through the Hugo handler with mocked store and Slack transport", async () => {
    classifyHugoIntentMock.mockResolvedValue({
      intent: "data_query",
      incident_reference: null,
      duration_days: null,
    });

    await handleHugoMention({
      channel: "C123",
      prompt: "show open incidents",
      teamId: "T123",
      userId: "U123",
    });

    expect(incidentStoreMock.list).toHaveBeenCalledWith({
      scope: { organizationId: "org-1", storeId: "store-1" },
    });
    expect(generateDataReplyMock).toHaveBeenCalledWith(
      "show open incidents",
      expect.stringContaining("There are no open incidents"),
      undefined,
    );
    expect(postSlackMessageMock).toHaveBeenCalledWith({
      channel: "C123",
      text: "data reply",
      threadTs: undefined,
    });
  });

  it("denies mutating Slack actions before resolving incidents when RBAC fails", async () => {
    classifyHugoIntentMock.mockResolvedValue({
      intent: "approve",
      incident_reference: "return spike",
      duration_days: null,
    });
    authorizeSlackActionMock.mockResolvedValue({
      allowed: false,
      reason: "Link your Slack account in Resolve before running actions from Slack.",
    });

    await handleHugoMention({
      channel: "C123",
      prompt: "approve return spike",
      teamId: "T123",
      userId: "U999",
    });

    expect(authorizeSlackActionMock).toHaveBeenCalledWith({}, {
      organizationId: "org-1",
      slackUserId: "U999",
      action: "approve",
    });
    expect(incidentStoreMock.list).not.toHaveBeenCalled();
    expect(runHugoApprovalMock).not.toHaveBeenCalled();
    expect(postSlackMessageMock).toHaveBeenCalledWith({
      channel: "C123",
      text: "Link your Slack account in Resolve before running actions from Slack.",
      threadTs: undefined,
    });
  });

  it("runs approved low-risk fixes for an authorized Slack user", async () => {
    const incident = createIncidentFixture({ id: "inc-1", title: "Return spike" });
    classifyHugoIntentMock.mockResolvedValue({
      intent: "approve",
      incident_reference: "return spike",
      duration_days: null,
    });
    incidentStoreMock.list.mockResolvedValue([incident]);

    await handleHugoMention({
      channel: "C123",
      prompt: "approve return spike",
      teamId: "T123",
      userId: "U123",
      userName: "Nodir",
    });

    expect(runHugoApprovalMock).toHaveBeenCalledWith({}, incident, "Nodir");
    expect(postSlackMessageMock).toHaveBeenCalledWith({
      channel: "C123",
      text: "approved fixes",
      threadTs: undefined,
    });
  });
});
