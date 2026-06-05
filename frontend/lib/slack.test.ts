import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseSlackEventEnvelope,
  parseSlackInteractionPayload,
  slackInteractionPayloadSchema,
  stripSlackMentions,
  verifySlackRequest,
} from "./slack";

describe("parseSlackInteractionPayload", () => {
  it("parses valid Slack interaction JSON", () => {
    const raw = JSON.stringify({
      actions: [{ action_id: "approve_low_risk", value: "inc-1" }],
      user: { name: "demo" },
    });
    const parsed = parseSlackInteractionPayload(raw);
    expect(parsed?.actions?.[0]?.action_id).toBe("approve_low_risk");
    expect(parsed?.user?.name).toBe("demo");
  });

  it("returns null for invalid JSON", () => {
    expect(parseSlackInteractionPayload("not-json")).toBeNull();
  });

  it("returns null when schema fails", () => {
    const raw = JSON.stringify({ actions: [{ action_id: 123, value: "x" }] });
    expect(parseSlackInteractionPayload(raw)).toBeNull();
    expect(slackInteractionPayloadSchema.safeParse(JSON.parse(raw)).success).toBe(false);
  });
});

describe("verifySlackRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects when signing secret is missing", () => {
    expect(
      verifySlackRequest("body", { signature: "v0=abc", timestamp: String(Math.floor(Date.now() / 1000)) }),
    ).toBe(false);
  });

  it("accepts a valid signature", () => {
    const secret = "signing-secret";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = "payload=test";
    const sig =
      "v0=" +
      createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex");
    expect(
      verifySlackRequest(body, { signature: sig, timestamp }, secret),
    ).toBe(true);
  });

  it("rejects stale timestamps", () => {
    const secret = "signing-secret";
    const timestamp = String(Math.floor(Date.now() / 1000) - 600);
    const body = "payload=test";
    const sig =
      "v0=" +
      createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex");
    expect(
      verifySlackRequest(body, { signature: sig, timestamp }, secret),
    ).toBe(false);
  });
});

describe("parseSlackEventEnvelope", () => {
  it("parses a url_verification challenge", () => {
    const raw = JSON.stringify({ type: "url_verification", challenge: "abc123" });
    const parsed = parseSlackEventEnvelope(raw);
    expect(parsed?.type).toBe("url_verification");
    expect(parsed?.challenge).toBe("abc123");
  });

  it("parses an app_mention event_callback", () => {
    const raw = JSON.stringify({
      type: "event_callback",
      event: { type: "app_mention", text: "<@U1> hi", channel: "C1", ts: "1.2" },
    });
    const parsed = parseSlackEventEnvelope(raw);
    expect(parsed?.event?.type).toBe("app_mention");
    expect(parsed?.event?.channel).toBe("C1");
  });

  it("returns null for invalid JSON", () => {
    expect(parseSlackEventEnvelope("not-json")).toBeNull();
  });
});

describe("stripSlackMentions", () => {
  it("removes user mentions and collapses whitespace", () => {
    expect(stripSlackMentions("<@U0BOTID>   what's   up?")).toBe("what's up?");
  });

  it("removes multiple mentions", () => {
    expect(stripSlackMentions("hi <@U1> and <@U2>")).toBe("hi and");
  });
});
