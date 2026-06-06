/**
 * Slack Incoming Webhook notifications and interactive approve callbacks.
 * RUN-51: approval cards use `/api/slack/webhook` + `SLACK_SIGNING_SECRET` — not Vercel Chat SDK.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import { resolveOrganizationSlackDeliveryChannel } from "@/lib/tenancy/server";

export type SlackIncidentPayload = {
  organization_id: string;
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

/** Block Kit payload for an incident notification card. */
export function buildIncidentNotificationBlocks(payload: SlackIncidentPayload): object[] {
  const emoji = severityEmoji(payload.severity);
  const impact = payload.impact_amount
    ? `${formatCurrency(payload.impact_amount)} ${payload.impact_label ?? ""}`
    : "Calculating…";

  const actionLines = payload.actions
    ?.map((a, i) =>
      `${i + 1}. ${a.title} ${a.auto_deploy ? "[Auto-deploys]" : `[Risk: ${a.risk_level}]`}`,
    )
    .join("\n") ?? "Investigating…";

  const showApproveButton =
    payload.status === "fix_proposed" && (payload.actions?.length ?? 0) > 0;

  return [
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
    ...(showApproveButton
      ? [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Proposed Actions:*\n${actionLines}`,
          },
        }]
      : payload.status === "monitoring"
        ? [{
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Recovery:*\nIncident approved — monitoring recovery in Hugo.",
            },
          }]
        : []),
    {
      type: "actions",
      elements: [
        ...(showApproveButton
          ? [{
              type: "button",
              text: { type: "plain_text", text: "Approve Low-Risk Actions" },
              style: "primary",
              action_id: "approve_low_risk",
              value: payload.incident_id,
            }]
          : []),
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
}

export async function sendIncidentNotification(
  payload: SlackIncidentPayload,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const blocks = buildIncidentNotificationBlocks(payload);
  const text = `Incident: ${payload.title} (${payload.severity})`;
  await postOrgSlackBlocks(supabase, payload.organization_id, blocks, text);
}

export type NewIncidentAlert = {
  organization_id: string;
  incident_id: string;
  title: string;
  severity: string;
  impact_amount: number | null;
  impact_label: string | null;
};

/**
 * Fire a Slack alert for a newly detected incident (severity, exposure, Approve
 * button). Called from detection when a breach/forecast opens an incident.
 * Never throws — a Slack failure must not abort detection.
 */
export async function notifyNewIncident(
  supabase: SupabaseClient<Database>,
  alert: NewIncidentAlert,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    await sendIncidentNotification(
      {
        organization_id: alert.organization_id,
        title: alert.title,
        severity: alert.severity,
        status: "detected",
        impact_amount: alert.impact_amount,
        impact_label: alert.impact_label,
        incident_id: alert.incident_id,
        app_url: appUrl,
      },
      supabase,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Slack] new-incident alert failed: ${message}`);
  }
}

/** Slack interactive webhook: URL-encoded form with a JSON `payload` field. */
export const slackInteractionPayloadSchema = z.object({
  team: z.object({ id: z.string() }).optional(),
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

/* -------------------------------------------------------------------------- */
/* Events API: @hugo conversational bot                                       */
/* -------------------------------------------------------------------------- */

/**
 * Slack Events API envelope. `url_verification` carries a `challenge` we echo
 * back; `event_callback` wraps an inner event (we handle `app_mention`).
 * See https://api.slack.com/apis/connections/events-api
 */
export const slackEventEnvelopeSchema = z.object({
  type: z.string(),
  challenge: z.string().optional(),
  team_id: z.string().optional(),
  event: z
    .object({
      type: z.string(),
      text: z.string().optional(),
      user: z.string().optional(),
      channel: z.string().optional(),
      ts: z.string().optional(),
      thread_ts: z.string().optional(),
      bot_id: z.string().optional(),
      subtype: z.string().optional(),
      team: z.string().optional(),
    })
    .optional(),
});

export type SlackEventEnvelope = z.infer<typeof slackEventEnvelopeSchema>;

export function parseSlackEventEnvelope(raw: string): SlackEventEnvelope | null {
  try {
    const parsed = slackEventEnvelopeSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Remove Slack user mentions (`<@U123>`) and collapse whitespace. */
export function stripSlackMentions(text: string): string {
  return text.replace(/<@[A-Z0-9]+>/g, " ").replace(/\s+/g, " ").trim();
}

export type SlackThreadMessage = {
  type?: string;
  user?: string;
  bot_id?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
};

export type SlackThreadReadResult =
  | { ok: true; messages: SlackThreadMessage[] }
  | { ok: false; error: string };

export async function fetchSlackThreadMessages(args: {
  channel: string;
  threadTs: string;
}): Promise<SlackThreadReadResult> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "missing_bot_token" };

  const url = new URL("https://slack.com/api/conversations.replies");
  url.searchParams.set("channel", args.channel);
  url.searchParams.set("ts", args.threadTs);
  url.searchParams.set("limit", "20");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; messages?: SlackThreadMessage[] }
    | null;

  if (!json?.ok) return { ok: false, error: json?.error ?? `http_${res.status}` };
  return { ok: true, messages: json.messages ?? [] };
}

/**
 * Post a message to a Slack channel via the Web API (`chat.postMessage`),
 * authenticated with the bot token. `threadTs` keeps replies in-thread.
 * Never throws — logs and returns on failure.
 */
export async function postSlackMessage(args: {
  channel: string;
  text: string;
  threadTs?: string;
  blocks?: object[];
}): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[Slack] SLACK_BOT_TOKEN not set — skipping chat.postMessage");
    return;
  }

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel: args.channel,
      text: args.text,
      ...(args.threadTs ? { thread_ts: args.threadTs } : {}),
      ...(args.blocks ? { blocks: args.blocks } : {}),
    }),
  });

  const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!json?.ok) {
    console.error(`[Slack] chat.postMessage failed: ${json?.error ?? res.status}`);
  }
}

/**
 * Post Block Kit blocks to an org's Slack channel via the bot token when
 * `organizations.slack_channel_id` or `SLACK_DEFAULT_CHANNEL` is set; otherwise
 * falls back to the incoming webhook. Never throws — logs on failure.
 */
export async function postOrgSlackBlocks(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  blocks: object[],
  fallbackText: string,
): Promise<void> {
  const channel = await resolveOrganizationSlackDeliveryChannel(supabase, organizationId);
  if (channel && process.env.SLACK_BOT_TOKEN) {
    await postSlackMessage({ channel, text: fallbackText, blocks });
    return;
  }
  await postWebhookBlocks(blocks);
}

/**
 * Post Block Kit blocks to the incoming webhook channel (legacy global fallback).
 * Never throws — logs on failure.
 */
export async function postWebhookBlocks(blocks: object[]): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[Slack] SLACK_WEBHOOK_URL not set — skipping webhook post");
    return;
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Slack] Webhook blocks failed: ${res.status} ${text}`);
  }
}
