import { beforeEach, describe, expect, it, vi } from "vitest";
import { classifyHugoIntent } from "./intent";

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
      output: { intent: "approve", incident_reference: "ROAS" },
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
    expect(generateTextMock).not.toHaveBeenCalled();
  });
});
