import { describe, expect, it } from "vitest";
import AgentFindingCard from "@/components/incidents/AgentFindingCard";
import { createAgentFindingFixture } from "@/test/fixtures";
import { render, screen } from "@/test/test-utils";

describe("AgentFindingCard", () => {
  it("renders agent name and summary", () => {
    const finding = createAgentFindingFixture({
      agent_name: "Returns Analyst",
      summary: "Return rate elevated",
      agent_icon: "📦",
    });
    render(<AgentFindingCard finding={finding} />);
    expect(screen.getByText("Returns Analyst")).toBeInTheDocument();
    expect(screen.getByText("Return rate elevated")).toBeInTheDocument();
    expect(screen.getByText("📦")).toBeInTheDocument();
  });
});
