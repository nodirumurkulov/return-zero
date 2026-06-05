import type { Incident } from "@/lib/stores/incidents/incident";

const RESOLVED_STATUSES = new Set(["resolved", "canceled"]);

type SeverityKey = "critical" | "high" | "medium" | "low";

export type DigestSummary = {
  openCount: number;
  totalExposure: number;
  awaitingApproval: number;
  bySeverity: Record<SeverityKey, number>;
  topIncidents: Pick<
    Incident,
    "id" | "title" | "severity" | "status" | "impact_amount"
  >[];
};

/** Summarize incidents into a digest payload (pure, no side effects). */
export function summarizeIncidents(incidents: Incident[]): DigestSummary {
  const open = incidents.filter(
    (i) => !RESOLVED_STATUSES.has(i.status.toLowerCase()),
  );

  const { bySeverity, totalExposure, awaitingApproval } = open.reduce(
    (acc, inc) => {
      const sev = inc.severity.toLowerCase() as SeverityKey;
      if (sev in acc.bySeverity) acc.bySeverity[sev]++;
      acc.totalExposure += Number(inc.impact_amount ?? 0);
      if (inc.status === "awaiting_approval") acc.awaitingApproval++;
      return acc;
    },
    {
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 } satisfies Record<
        SeverityKey,
        number
      >,
      totalExposure: 0,
      awaitingApproval: 0,
    },
  );

  const topIncidents = open
    .sort((a, b) => Number(b.impact_amount ?? 0) - Number(a.impact_amount ?? 0))
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
      impact_amount: i.impact_amount,
    }));

  return { openCount: open.length, totalExposure, awaitingApproval, bySeverity, topIncidents };
}

function severityEmoji(severity: string): string {
  switch (severity) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
}

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Build Slack Block Kit blocks for a daily digest. */
export function buildDigestBlocks(
  orgName: string,
  summary: DigestSummary,
  appUrl: string,
): object[] {
  if (summary.openCount === 0) {
    return [
      {
        type: "header",
        text: { type: "plain_text", text: `📋 Daily Digest — ${orgName}` },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "All clear — no open incidents. 🎉",
        },
      },
    ];
  }

  const sevParts = (
    ["critical", "high", "medium", "low"] as SeverityKey[]
  )
    .filter((s) => summary.bySeverity[s] > 0)
    .map((s) => `${severityEmoji(s)} ${summary.bySeverity[s]} ${s}`);

  const incidentLines = summary.topIncidents
    .map(
      (i) =>
        `${severityEmoji(i.severity)} *${i.title}* — ${formatGBP(Number(i.impact_amount ?? 0))}`,
    )
    .join("\n");

  return [
    {
      type: "header",
      text: { type: "plain_text", text: `📋 Daily Digest — ${orgName}` },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Open incidents:*\n${summary.openCount}`,
        },
        {
          type: "mrkdwn",
          text: `*Total exposure:*\n${formatGBP(summary.totalExposure)}`,
        },
        {
          type: "mrkdwn",
          text: `*Awaiting approval:*\n${summary.awaitingApproval}`,
        },
        {
          type: "mrkdwn",
          text: `*By severity:*\n${sevParts.join("  ")}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Top incidents:*\n${incidentLines}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Review All Incidents" },
          url: `${appUrl}/incidents`,
          action_id: "open_incidents",
        },
      ],
    },
  ];
}
