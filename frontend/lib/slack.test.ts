import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildIncidentNotificationBlocks,
  parseSlackEventEnvelope,
  parseSlackInteractionPayload,
  slackInteractionPayloadSchema,
  stripSlackMentions,
  verifySlackRequest,
} from "./slack";

describe("buildIncidentNotificationBlocks", () => {
  it("includes approve button for fix_proposed incidents with actions", () => {
    const blocks = buildIncidentNotificationBlocks({
      organization_id: "org-1",
      title: "Return spike",
      severity: "high",
      status: "fix_proposed",
      incident_id: "inc-1",
      app_url: "http://localhost:3000",
      root_cause:
        "Refund rate is above target, but the confidence interval is wide and there is no support-volume spike.",
      actions: [
        { title: "Pause ads", auto_deploy: false, risk_level: "low" },
        { title: "Tag refund cases", auto_deploy: false, risk_level: "low" },
      ],
    });
    const json = JSON.stringify(blocks);
    expect(json).toContain("approve_low_risk");
    expect(json).toContain("Return spike");
    expect(json).toContain("Likely issue");
    expect(json).toContain("Refund rate is above target");
    expect(json).toContain("2 proposed fixes ready for review in the app");
    expect(json).not.toContain("Pause ads");
    expect(json).not.toContain("Tag refund cases");
    expect(json).not.toContain("confidence interval is wide");
  });
});

describe("parseSlackInteractionPayload", () => {
  it("parses valid Slack interaction JSON", () => {
    const raw = JSON.stringify({
      actions: [{ action_id: "approve_low_risk", value: "inc-1" }],
      user: { id: "U123", name: "demo" },
    });
    const parsed = parseSlackInteractionPayload(raw);
    expect(parsed?.actions?.[0]?.action_id).toBe("approve_low_risk");
    expect(parsed?.user?.id).toBe("U123");
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
