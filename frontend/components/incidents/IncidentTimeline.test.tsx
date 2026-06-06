import { describe, expect, it } from "vitest";
import IncidentTimeline from "@/components/incidents/IncidentTimeline";
import { createAnomalyDetectedEventFixture, createTimelineEventFixture } from "@/test/fixtures";
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

  it("renders breach details under anomaly_detected", () => {
    const events = [createAnomalyDetectedEventFixture()];
    render(<IncidentTimeline events={events} />);
    expect(screen.getByText(/Return rate 22\.5% exceeded threshold/)).toBeInTheDocument();
    expect(screen.getByText("22.5% (target ≤20.0%)")).toBeInTheDocument();
    expect(screen.getByText("z 2.34")).toBeInTheDocument();
  });
});
