import { beforeEach, describe, expect, it, vi } from "vitest";
import { classifyHugoIntent } from "./intent";
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
  it("uses the LLM classification when available", async () => {
    generateTextMock.mockResolvedValue({
      output: { intent: "approve", incident_reference: "ROAS", duration_days: null },
    });
    const result = await classifyHugoIntent("please approve the ROAS fix");
    expect(result.intent).toBe("approve");
    expect(result.incident_reference).toBe("ROAS");
  });

  it("throws when the LLM returns no structured output", async () => {
    generateTextMock.mockResolvedValue({ output: undefined });
    await expect(classifyHugoIntent("investigate the return spike")).rejects.toThrow(
      /missing structured output/,
    );
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
