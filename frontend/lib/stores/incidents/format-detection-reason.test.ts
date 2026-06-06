import { describe, expect, it } from "vitest";
import {
  formatDetectionReasonFromEvent,
  getDetectionReason,
} from "@/lib/stores/incidents/format-detection-reason";
import { createTimelineEventFixture } from "@/test/fixtures";

describe("formatDetectionReasonFromEvent", () => {
  it("parses breach metadata with quant stats", () => {
    const event = createTimelineEventFixture({
      event_type: "anomaly_detected",
      metadata: {
        breaches: [
          {
            metric: "return_rate",
            display_name: "Return rate",
            unit: "ratio",
            value: 0.225,
            threshold: 0.2,
            direction: "above",
          },
          {
            metric: "refund_rate",
            display_name: "Refund rate",
            unit: "ratio",
            value: 0.141,
            threshold: 0.12,
            direction: "above",
          },
        ],
        quant: { z_score: 2.34, confidence: "high" },
      },
    });

    const reason = formatDetectionReasonFromEvent(event);
    expect(reason?.kind).toBe("breach");
    expect(reason?.summary).toBe("Return rate 22.5% exceeded threshold ≤20.0%");
    expect(reason?.lines).toHaveLength(2);
    expect(reason?.lines[0]).toEqual({
      label: "Return rate",
      detail: "22.5% (target ≤20.0%)",
    });
    expect(reason?.stats).toEqual({ z_score: 2.34, confidence: "high" });
  });

  it("parses forecast metadata", () => {
    const event = createTimelineEventFixture({
      event_type: "anomaly_detected",
      metadata: {
        forecast: true,
        risks: [
          {
            kind: "stockout",
            message: "forecast stockout in ~12 days",
            severity: "high",
          },
        ],
      },
    });

    const reason = formatDetectionReasonFromEvent(event);
    expect(reason?.kind).toBe("forecast");
    expect(reason?.summary).toBe("forecast stockout in ~12 days");
    expect(reason?.lines[0]?.label).toBe("Stockout");
  });

  it("parses seed-style simple metadata", () => {
    const event = createTimelineEventFixture({
      event_type: "anomaly_detected",
      metadata: { threshold: 0.2, actual: 0.225, product: "Court Trainer" },
    });

    const reason = formatDetectionReasonFromEvent(event);
    expect(reason?.kind).toBe("simple");
    expect(reason?.summary).toContain("Court Trainer");
    expect(reason?.summary).toContain("22.5%");
    expect(reason?.lines[0]?.detail).toBe("22.5% (threshold 20%)");
  });

  it("falls back to description when metadata is absent", () => {
    const event = createTimelineEventFixture({
      event_type: "anomaly_detected",
      description: "Return rate crossed threshold",
      metadata: null,
    });

    const reason = formatDetectionReasonFromEvent(event);
    expect(reason?.summary).toBe("Return rate crossed threshold");
  });
});

describe("getDetectionReason", () => {
  it("parses incident_created events with breach metadata", () => {
    const timeline = [
      createTimelineEventFixture({
        event_type: "incident_created",
        metadata: {
          breaches: [
            {
              metric: "return_rate",
              display_name: "Return rate",
              unit: "ratio",
              value: 0.225,
              threshold: 0.2,
              direction: "above",
            },
          ],
        },
      }),
    ];

    const reason = getDetectionReason(timeline);
    expect(reason?.kind).toBe("breach");
    expect(reason?.summary).toContain("22.5%");
  });

  it("uses earliest detection event with metadata", () => {
    const timeline = [
      createTimelineEventFixture({ event_type: "incident_created" }),
      createTimelineEventFixture({
        event_type: "anomaly_detected",
        metadata: {
          breaches: [
            {
              metric: "return_rate",
              unit: "ratio",
              value: 0.225,
              threshold: 0.2,
              direction: "above",
            },
          ],
        },
      }),
    ];

    const reason = getDetectionReason(timeline);
    expect(reason?.kind).toBe("breach");
    expect(reason?.summary).toContain("22.5%");
  });

  it("falls back to incident title when timeline has no anomaly data", () => {
    const reason = getDetectionReason([], { title: "Court Trainer Return Spike" });
    expect(reason?.summary).toBe("Court Trainer Return Spike");
  });
});
