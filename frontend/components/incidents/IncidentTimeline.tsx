export type TimelineEvent = {
  id: string;
  event_type: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

const icons: Record<string, string> = {
  anomaly_detected: "🔍",
  incident_created: "🚨",
  agent_assigned:   "🤖",
  root_cause_found: "💡",
  action_proposed:  "📋",
  approved:         "✅",
  deployed:         "🚀",
  monitoring:       "📊",
  resolved:         "✓",
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function IncidentTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((event, i) => (
        <li key={event.id} className="flex gap-4">
          {/* Vertical line + dot */}
          <div className="flex flex-col items-center">
            <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-base">
              {icons[event.event_type] ?? "•"}
            </div>
            {i < events.length - 1 && (
              <div className="mb-0 mt-0 min-h-[1.5rem] w-px flex-1 bg-border" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 pb-6">
            <p className="text-sm leading-snug text-foreground">{event.description}</p>
            <time className="mt-0.5 block font-mono text-xs text-muted-foreground">
              {formatTime(event.created_at)}
            </time>
          </div>
        </li>
      ))}
      {events.length === 0 && (
        <li className="text-sm text-muted-foreground">No events yet</li>
      )}
    </ol>
  );
}
