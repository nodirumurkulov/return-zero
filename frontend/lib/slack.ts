/**
 * lib/slack.ts
 * Slack Incoming Webhook notifications for Resolve.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

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

/** Slack interactive webhook: URL-encoded form with a JSON `payload` field. */
export const slackInteractionPayloadSchema = z.object({
  actions: z
    .array(
      z.object({
        action_id: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  user: z.object({ name: z.string() }).optional(),
});

export type SlackInteractionPayload = z.infer<typeof slackInteractionPayloadSchema>;

export function parseSlackInteractionPayload(raw: string): SlackInteractionPayload | null {
  try {
    const parsed = slackInteractionPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Slack request signing.
 * Slack signs each request as `v0=HMAC_SHA256(signingSecret, "v0:{timestamp}:{rawBody}")`,
 * sent in the `X-Slack-Signature` header alongside `X-Slack-Request-Timestamp`.
 * See https://api.slack.com/authentication/verifying-requests-from-slack
 */
const SLACK_SIGNATURE_VERSION = "v0";
const MAX_TIMESTAMP_SKEW_SECONDS = 60 * 5;

export type SlackSignatureHeaders = {
  signature: string | null;
  timestamp: string | null;
};

/**
 * Verify an inbound Slack request signature. Returns false (reject) when the
 * signing secret is unset, headers are missing/malformed, the timestamp is
 * stale (replay), or the HMAC does not match. Comparison is constant-time.
 */
export function verifySlackRequest(
  rawBody: string,
  { signature, timestamp }: SlackSignatureHeaders,
  signingSecret: string | undefined = process.env.SLACK_SIGNING_SECRET,
): boolean {
  if (!signingSecret || !signature || !timestamp) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_TIMESTAMP_SKEW_SECONDS) {
    return false;
  }

  const basestring = `${SLACK_SIGNATURE_VERSION}:${timestamp}:${rawBody}`;
  const expected = `${SLACK_SIGNATURE_VERSION}=${createHmac("sha256", signingSecret)
    .update(basestring)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
