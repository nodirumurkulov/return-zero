import { describe, expect, it } from "vitest";
import IncidentTimeline from "@/components/incidents/IncidentTimeline";
import { createTimelineEventFixture } from "@/test/fixtures";
import { render, screen } from "@/test/test-utils";

describe("IncidentTimeline", () => {
  it("renders events in order", () => {
    const events = [
      createTimelineEventFixture({
        id: "e1",
        description: "First event",
        event_type: "incident_created",
      }),
      createTimelineEventFixture({
        id: "e2",
        description: "Second event",
        event_type: "approved",
      }),
    ];
    render(<IncidentTimeline events={events} />);
    expect(screen.getByText("First event")).toBeInTheDocument();
    expect(screen.getByText("Second event")).toBeInTheDocument();
  });

  it("shows placeholder when empty", () => {
    render(<IncidentTimeline events={[]} />);
    expect(screen.getByText("No events yet")).toBeInTheDocument();
  });
});
