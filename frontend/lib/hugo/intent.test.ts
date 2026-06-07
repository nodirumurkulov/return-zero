import { beforeEach, describe, expect, it, vi } from "vitest";
import { classifyHugoIntent } from "./intent";
import { matchDeterministicIntent } from "./intent-fallback";
import { hugoIntentSchema } from "./schemas";

const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }));

vi.mock("ai", () => ({
  generateText: generateTextMock,
  Output: { object: (config: { schema: unknown }) => config },
}));

beforeEach(() => {
  generateTextMock.mockReset();
});

describe("classifyHugoIntent", () => {
  it("uses deterministic routing for obvious commands without calling the LLM", async () => {
    const result = await classifyHugoIntent("investigate return spike");

    expect(result).toEqual({
      intent: "investigate",
      incident_reference: "return spike",
      duration_days: null,
    });
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("uses the LLM classification when available", async () => {
    generateTextMock.mockResolvedValue({
      output: { intent: "approve", incident_reference: "ROAS", duration_days: null },
    });
    const result = await classifyHugoIntent("can you handle the ROAS fix?");
    expect(result.intent).toBe("approve");
    expect(result.incident_reference).toBe("ROAS");
  });

  it("includes Slack thread context when classifying ambiguous follow-ups", async () => {
    generateTextMock.mockResolvedValue({
      output: { intent: "approve", incident_reference: "second one", duration_days: null },
    });

    await classifyHugoIntent(
      "the second one please",
      "Hugo: 1. Return spike [aaaaaaaa]\n2. ROAS drop [bbbbbbbb]",
    );

    expect(JSON.stringify(generateTextMock.mock.calls)).toContain("Slack thread so far:");
  });

  it("falls back to deterministic data query routing when the LLM returns no structured output", async () => {
    generateTextMock.mockResolvedValue({ output: undefined });
    await expect(classifyHugoIntent("what is the recovery status?")).resolves.toEqual({
      intent: "data_query",
      incident_reference: null,
      duration_days: null,
    });
  });

  it("returns chat for empty prompts without calling the LLM", async () => {
    const result = await classifyHugoIntent("   ");
    expect(result.intent).toBe("chat");
    expect(result.duration_days).toBeNull();
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("requires null incident_reference when the classifier has no reference", () => {
    expect(hugoIntentSchema.safeParse({ intent: "chat", duration_days: null }).success).toBe(false);
    expect(
      hugoIntentSchema.safeParse({ intent: "chat", incident_reference: null, duration_days: null })
        .success,
    ).toBe(true);
  });

  it("supports Slack action intents with snooze duration", () => {
    expect(
      hugoIntentSchema.safeParse({
        intent: "snooze",
        incident_reference: "return spike",
        duration_days: 7,
      }).success,
    ).toBe(true);

    expect(
      hugoIntentSchema.safeParse({
        intent: "resolve",
        incident_reference: "return spike",
        duration_days: null,
      }).success,
    ).toBe(true);
  });
});

describe("matchDeterministicIntent", () => {
  it("matches obvious action commands", () => {
    expect(matchDeterministicIntent("approve ROAS drop")).toEqual({
      intent: "approve",
      incident_reference: "ROAS drop",
      duration_days: null,
    });
    expect(matchDeterministicIntent("snooze return spike for 3 days")).toEqual({
      intent: "snooze",
      incident_reference: "return spike for 3 days",
      duration_days: 3,
    });
  });

  it("returns null for prompts that need the LLM", () => {
    expect(matchDeterministicIntent("hello there")).toBeNull();
  });
});
