import { createHmac } from "node:crypto";
import type * as NextServer from "next/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof NextServer>();
  return {
    ...actual,
    after: vi.fn((fn: () => void) => fn()),
  };
});

vi.mock("@/lib/hugo", () => ({
  handleHugoMention: vi.fn(),
}));

import { POST } from "@/app/api/slack/commands/route";
import { handleHugoMention } from "@/lib/hugo";

const handleHugoMentionMock = vi.mocked(handleHugoMention);

function signedFormBody(params: Record<string, string>, secret = "slack-signing-secret") {
  const body = new URLSearchParams(params).toString();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature =
    "v0=" +
    createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex");
  return { body, timestamp, signature, secret };
}

describe("POST /api/slack/commands", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 when signature is invalid", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/slack/commands", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-slack-signature": "v0=bad",
          "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
        },
        body: "command=%2Fresolve&text=status",
      }),
    );

    expect(res.status).toBe(401);
    expect(handleHugoMentionMock).not.toHaveBeenCalled();
  });

  it("acks slash commands and delegates prompt text to Hugo", async () => {
    const { body, timestamp, signature, secret } = signedFormBody({
      command: "/resolve",
      text: "investigate return spike",
      channel_id: "C123",
      user_id: "U123",
      team_id: "T123",
      response_url: "https://hooks.slack.com/commands/123",
    });
    vi.stubEnv("SLACK_SIGNING_SECRET", secret);

    const res = await POST(
      new NextRequest("http://localhost/api/slack/commands", {
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
    await expect(res.json()).resolves.toEqual({
      response_type: "ephemeral",
      text: "Working on it...",
    });
    expect(handleHugoMentionMock).toHaveBeenCalledWith({
      channel: "C123",
      prompt: "investigate return spike",
      userName: "U123",
      userId: "U123",
      teamId: "T123",
    });
  });
});
