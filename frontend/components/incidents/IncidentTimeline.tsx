import DetectionReasonDetails from "@/components/incidents/DetectionReasonDetails";
import type { TimelineEvent } from "@/lib/stores";
import { formatDetectionReasonFromEvent } from "@/lib/stores/incidents/format-detection-reason";

const icons: Record<string, string> = {
  anomaly_detected: "🔍",
  incident_created: "🚨",
  agent_assigned: "🤖",
  root_cause_found: "💡",
  action_proposed: "📋",
  approved: "✅",
  deployed: "🚀",
  monitoring: "📊",
  resolved: "✓",
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isDetectionEvent(event: TimelineEvent): boolean {
  return event.event_type === "anomaly_detected" || event.event_type === "incident_created";
}

export default function IncidentTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events yet</p>;
  }
  return (
    <ol className="relative">
      {events.map((event, i) => {
        const last = i === events.length - 1;
        const detectionReason = isDetectionEvent(event)
          ? formatDetectionReasonFromEvent(event)
          : null;
        const showDetails = detectionReason != null && detectionReason.lines.length > 0;
        return (
          <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!last ? <span className="absolute left-[15px] top-8 h-full w-px bg-border" /> : null}
            <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm">
              {icons[event.event_type] ?? "•"}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[13px] leading-snug text-foreground [text-wrap:pretty]">
                {event.description}
              </p>
              {showDetails && detectionReason ? (
                <DetectionReasonDetails reason={detectionReason} />
              ) : null}
              <time className="mt-0.5 block tabnum text-[11px] text-muted-foreground">
                {formatTime(event.created_at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
