import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateChatReply, generateDataReply } from "./reply";

const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }));

vi.mock("ai", () => ({
  generateText: generateTextMock,
}));

beforeEach(() => {
  generateTextMock.mockReset();
});

describe("generateChatReply", () => {
  it("returns a greeting for empty prompts without calling the LLM", async () => {
    const reply = await generateChatReply("   ");
    expect(reply).toMatch(/Hugo/);
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("throws when the LLM returns empty text", async () => {
    generateTextMock.mockResolvedValue({ text: "" });
    await expect(generateChatReply("hello")).rejects.toThrow(/empty model response/);
  });
});

describe("generateDataReply", () => {
  it("passes the context to the LLM and returns its answer", async () => {
    generateTextMock.mockResolvedValue({ text: "There are 2 open incidents." });
    const reply = await generateDataReply("how many incidents?", "Open incidents (2 of 5)");
    expect(reply).toBe("There are 2 open incidents.");
    const messages = generateTextMock.mock.calls[0][0].messages as Array<{ content: string }>;
    expect(messages[1].content).toContain("Open incidents (2 of 5)");
  });
});
