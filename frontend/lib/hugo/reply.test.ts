import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateChatReply, generateDataReply } from "./reply";

const { callLLMTextMock } = vi.hoisted(() => ({ callLLMTextMock: vi.fn() }));

vi.mock("@/lib/llm", () => ({ callLLMText: callLLMTextMock }));

beforeEach(() => {
  callLLMTextMock.mockReset();
});

describe("generateChatReply", () => {
  it("returns a greeting for empty prompts without calling the LLM", async () => {
    const reply = await generateChatReply("   ");
    expect(reply).toMatch(/Hugo/);
    expect(callLLMTextMock).not.toHaveBeenCalled();
  });

  it("falls back to a friendly message when the LLM is unavailable", async () => {
    callLLMTextMock.mockResolvedValue("");
    const reply = await generateChatReply("hello");
    expect(reply).toMatch(/couldn't generate/i);
  });
});

describe("generateDataReply", () => {
  it("passes the context to the LLM and returns its answer", async () => {
    callLLMTextMock.mockResolvedValue("There are 2 open incidents.");
    const reply = await generateDataReply("how many incidents?", "Open incidents (2 of 5)");
    expect(reply).toBe("There are 2 open incidents.");
    const messages = callLLMTextMock.mock.calls[0][0] as Array<{ content: string }>;
    expect(messages[1].content).toContain("Open incidents (2 of 5)");
  });
});
