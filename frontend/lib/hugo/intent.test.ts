import { beforeEach, describe, expect, it, vi } from "vitest";
import { classifyHugoIntent } from "./intent";

const { callLLMJsonMock } = vi.hoisted(() => ({ callLLMJsonMock: vi.fn() }));

vi.mock("@/lib/llm", () => ({ callLLMJson: callLLMJsonMock }));

beforeEach(() => {
  callLLMJsonMock.mockReset();
});

describe("classifyHugoIntent", () => {
  it("uses the LLM classification when available", async () => {
    callLLMJsonMock.mockResolvedValue({ intent: "approve", incident_reference: "ROAS" });
    const result = await classifyHugoIntent("please approve the ROAS fix");
    expect(result.intent).toBe("approve");
    expect(result.incident_reference).toBe("ROAS");
  });

  it("falls back to keyword heuristics when the LLM returns null", async () => {
    callLLMJsonMock.mockResolvedValue(null);
    expect((await classifyHugoIntent("investigate the return spike")).intent).toBe("investigate");
    expect((await classifyHugoIntent("approve low risk fixes")).intent).toBe("approve");
    expect((await classifyHugoIntent("how many incidents are open?")).intent).toBe("data_query");
    expect((await classifyHugoIntent("hey there!")).intent).toBe("chat");
  });

  it("returns chat for empty prompts without calling the LLM", async () => {
    const result = await classifyHugoIntent("   ");
    expect(result.intent).toBe("chat");
    expect(callLLMJsonMock).not.toHaveBeenCalled();
  });
});
