/**
 * lib/slack.ts
 * Slack Incoming Webhook notifications for Resolve.
 */

export type SlackIncidentPayload = {
  title: string;
  severity: string;
  status: string;
  impact_amount?: number | null;
  impact_label?: string | null;
  root_cause?: string | null;
  root_cause_confidence?: number | null;
  actions?: Array<{
    title: string;
    auto_deploy: boolean;
    risk_level: string;
  }>;
  incident_id: string;
  app_url: string;
};

function severityEmoji(severity: string): string {
  switch (severity) {
    case "critical": return "🔴";
    case "high":     return "🟠";
    case "medium":   return "🟡";
    case "low":      return "🟢";
    default:         return "⚪";
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function sendIncidentNotification(
  payload: SlackIncidentPayload
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[Slack] SLACK_WEBHOOK_URL not set — skipping notification");
    return;
  }

  const emoji = severityEmoji(payload.severity);
  const impact = payload.impact_amount
    ? `${formatCurrency(payload.impact_amount)} ${payload.impact_label ?? ""}`
    : "Calculating…";

  const actionLines = payload.actions
    ?.map((a, i) =>
      `${i + 1}. ${a.title} ${a.auto_deploy ? "[Auto-deploys]" : `[Risk: ${a.risk_level}]`}`
    )
    .join("\n") ?? "Investigating…";

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Incident: ${payload.title}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Severity:*\n${payload.severity.toUpperCase()}` },
        { type: "mrkdwn", text: `*Status:*\n${payload.status.replace("_", " ").toUpperCase()}` },
        { type: "mrkdwn", text: `*Impact:*\n${impact}` },
        {
          type: "mrkdwn",
          text: `*Confidence:*\n${payload.root_cause_confidence != null ? `${payload.root_cause_confidence}%` : "—"}`,
        },
      ],
    },
    ...(payload.root_cause
      ? [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Root Cause:*\n${payload.root_cause}`,
          },
        }]
      : []),
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Proposed Actions:*\n${actionLines}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Approve Low-Risk Actions" },
          style: "primary",
          action_id: "approve_low_risk",
          value: payload.incident_id,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Review in App" },
          url: `${payload.app_url}/incidents/${payload.incident_id}`,
          action_id: "open_in_app",
          value: payload.incident_id,
        },
      ],
    },
  ];

  const body = JSON.stringify({ blocks });

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Slack] Webhook failed: ${res.status} ${text}`);
  }
}
