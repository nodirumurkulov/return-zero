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
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-base shrink-0 z-10">
              {icons[event.event_type] ?? "•"}
            </div>
            {i < events.length - 1 && (
              <div className="w-px flex-1 bg-zinc-800 mt-0 mb-0 min-h-[1.5rem]" />
            )}
          </div>

          {/* Content */}
          <div className="pb-6 flex-1 min-w-0">
            <p className="text-sm text-zinc-200 leading-snug">{event.description}</p>
            <time className="text-xs text-zinc-600 mt-0.5 font-mono block">
              {formatTime(event.created_at)}
            </time>
          </div>
        </li>
      ))}
      {events.length === 0 && (
        <li className="text-sm text-zinc-600">No events yet</li>
      )}
    </ol>
  );
}
