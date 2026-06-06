import type { HugoIntent } from "./schemas";

const DATA_QUERY_RE =
  /\b(status|list|show|open|incident|incidents|kpi|metrics?|products?|catalog|stock|inventory|recovery|impact|returns?|refunds?|roas|support)\b/i;

function referenceAfter(prompt: string, re: RegExp): string | null {
  const match = prompt.match(re);
  const reference = match?.[1]?.trim();
  return reference ? reference : null;
}

function durationDays(prompt: string): number {
  const match = prompt.match(/\b(\d{1,2})\s*(?:day|days|d)\b/i);
  return match ? Number(match[1]) : 7;
}

export function matchDeterministicIntent(prompt: string): HugoIntent | null {
  const clean = prompt.trim();
  if (!clean) return { intent: "chat", incident_reference: null, duration_days: null };

  if (/\b(investigate|diagnose|find root cause|root cause)\b/i.test(clean)) {
    return {
      intent: "investigate",
      incident_reference: referenceAfter(clean, /\b(?:investigate|diagnose|root cause)\b\s*(.*)$/i),
      duration_days: null,
    };
  }

  if (/\b(approve|apply|deploy)\b/i.test(clean)) {
    return {
      intent: "approve",
      incident_reference: referenceAfter(clean, /\b(?:approve|apply|deploy)\b\s*(.*)$/i),
      duration_days: null,
    };
  }

  if (/\b(resolve|close|mark resolved)\b/i.test(clean)) {
    return {
      intent: "resolve",
      incident_reference: referenceAfter(clean, /\b(?:resolve|close|mark resolved)\b\s*(.*)$/i),
      duration_days: null,
    };
  }

  if (/\b(reject|decline)\b/i.test(clean)) {
    return {
      intent: "reject",
      incident_reference: referenceAfter(clean, /\b(?:reject|decline)\b\s*(.*)$/i),
      duration_days: null,
    };
  }

  if (/\b(reopen|re-open)\b/i.test(clean)) {
    return {
      intent: "reopen",
      incident_reference: referenceAfter(clean, /\b(?:reopen|re-open)\b\s*(.*)$/i),
      duration_days: null,
    };
  }

  if (/\b(snooze|pause|mute)\b/i.test(clean)) {
    return {
      intent: "snooze",
      incident_reference: referenceAfter(clean, /\b(?:snooze|pause|mute)\b\s*(.*)$/i),
      duration_days: durationDays(clean),
    };
  }

  if (DATA_QUERY_RE.test(clean)) {
    return { intent: "data_query", incident_reference: null, duration_days: null };
  }

  return null;
}
