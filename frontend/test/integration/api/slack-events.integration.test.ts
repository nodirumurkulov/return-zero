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

import { POST } from "@/app/api/slack/events/route";
import { handleHugoMention } from "@/lib/hugo";

const handleHugoMentionMock = vi.mocked(handleHugoMention);

function signedJsonBody(payload: object, secret = "slack-signing-secret") {
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature =
    "v0=" +
    createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex");
  return { body, timestamp, signature, secret };
}

describe("POST /api/slack/events", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 when signature is invalid", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/slack/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-slack-signature": "v0=bad",
          "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
        },
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("responds to url_verification challenge", async () => {
    const { body, timestamp, signature, secret } = signedJsonBody({
      type: "url_verification",
      challenge: "challenge-token",
    });
    vi.stubEnv("SLACK_SIGNING_SECRET", secret);

    const res = await POST(
      new NextRequest("http://localhost/api/slack/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-slack-signature": signature,
          "x-slack-request-timestamp": timestamp,
        },
        body,
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { challenge: string };
    expect(json.challenge).toBe("challenge-token");
    expect(handleHugoMentionMock).not.toHaveBeenCalled();
  });

  it("passes app mentions to Hugo with thread metadata", async () => {
    const { body, timestamp, signature, secret } = signedJsonBody({
      type: "event_callback",
      team_id: "T123",
      event: {
        type: "app_mention",
        user: "U123",
        channel: "C123",
        text: "<@UHUGO> investigate the second one",
        ts: "1710000000.000100",
        thread_ts: "1710000000.000000",
      },
    });
    vi.stubEnv("SLACK_SIGNING_SECRET", secret);

    const res = await POST(
      new NextRequest("http://localhost/api/slack/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-slack-signature": signature,
          "x-slack-request-timestamp": timestamp,
        },
        body,
      }),
    );

    expect(res.status).toBe(200);
    expect(handleHugoMentionMock).toHaveBeenCalledWith({
      channel: "C123",
      threadTs: "1710000000.000000",
      prompt: "investigate the second one",
      userName: "U123",
      userId: "U123",
      teamId: "T123",
    });
  });

  it("passes direct messages to Hugo without requiring an app mention", async () => {
    const { body, timestamp, signature, secret } = signedJsonBody({
      type: "event_callback",
      team_id: "T123",
      event: {
        type: "message",
        subtype: "message.im",
        user: "U123",
        channel: "D123",
        text: "show open incidents",
        ts: "1710000000.000100",
        channel_type: "im",
      },
    });
    vi.stubEnv("SLACK_SIGNING_SECRET", secret);

    const res = await POST(
      new NextRequest("http://localhost/api/slack/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-slack-signature": signature,
          "x-slack-request-timestamp": timestamp,
        },
        body,
      }),
    );

    expect(res.status).toBe(200);
    expect(handleHugoMentionMock).toHaveBeenCalledWith({
      channel: "D123",
      threadTs: "1710000000.000100",
      prompt: "show open incidents",
      userName: "U123",
      userId: "U123",
      teamId: "T123",
    });
  });
});
