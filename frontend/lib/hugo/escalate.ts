import type { SupabaseClient } from "@supabase/supabase-js";

import { postOrgSlackBlocks } from "@/lib/slack";
import type { Incident } from "@/lib/stores";
import type { Database } from "@/lib/supabase/database.types";

const DEFAULT_ESCALATION_HOURS = 24;
const ESCALATION_EVENT_TYPE = "agent_assigned";
const ESCALATION_DEDUPE_HOURS = 24;

export type EscalationResult = {
  organizationId: string;
  count: number;
};

function escalationHours(): number {
  const parsed = Number(process.env.HUGO_ESCALATION_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ESCALATION_HOURS;
}

function cutoffIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function escalationDescription(incidentId: string): string {
  return `Hugo escalated awaiting approval incident ${incidentId}`;
}

export function staleAwaitingApprovalIncidents(
  incidents: Incident[],
  now = new Date(),
  hours = escalationHours(),
): Incident[] {
  const cutoff = now.getTime() - hours * 60 * 60 * 1000;
  return incidents.filter(
    (incident) =>
      incident.status === "awaiting_approval" &&
      new Date(incident.updated_at).getTime() < cutoff,
  );
}

async function recentlyEscalatedIncidentIds(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  incidentIds: string[],
): Promise<Set<string>> {
  if (incidentIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("incident_timeline")
    .select("incident_id, created_at, description")
    .eq("organization_id", organizationId)
    .eq("event_type", ESCALATION_EVENT_TYPE);

  if (error) throw new Error(`incident_timeline escalation read failed: ${error.message}`);

  const incidentIdSet = new Set(incidentIds);
  const cutoff = cutoffIso(ESCALATION_DEDUPE_HOURS);
  return new Set(
    (data ?? [])
      .filter(
        (event) =>
          incidentIdSet.has(event.incident_id) &&
          event.created_at >= cutoff &&
          event.description === escalationDescription(event.incident_id),
      )
      .map((event) => event.incident_id),
  );
}

function buildEscalationBlocks(orgName: string, incidents: Incident[], appUrl: string): object[] {
  const incidentLines = incidents
    .slice(0, 5)
    .map((incident) => {
      const impact = formatGBP(Number(incident.impact_amount ?? 0));
      return `• *${incident.title}* — ${impact}, updated ${new Date(incident.updated_at).toLocaleDateString("en-GB")}`;
    })
    .join("\n");

  return [
    {
      type: "header",
      text: { type: "plain_text", text: `Escalation — ${orgName}` },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `These incidents have been awaiting approval for more than ${escalationHours()} hours:\n${incidentLines}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Review approvals" },
          url: `${appUrl}/incidents`,
          action_id: "open_incidents",
        },
      ],
    },
  ];
}

async function recordEscalationTimelineEvents(
  supabase: SupabaseClient<Database>,
  incidents: Incident[],
): Promise<void> {
  if (incidents.length === 0) return;

  const { error } = await supabase.from("incident_timeline").insert(
    incidents.map((incident) => ({
      organization_id: incident.organization_id,
      incident_id: incident.id,
      event_type: ESCALATION_EVENT_TYPE,
      description: escalationDescription(incident.id),
      metadata: { escalation: "awaiting_approval" },
    })),
  );

  if (error) throw new Error(`incident_timeline escalation insert failed: ${error.message}`);
}

export async function postAwaitingApprovalEscalation(
  supabase: SupabaseClient<Database>,
  args: {
    organizationId: string;
    orgName: string;
    incidents: Incident[];
    appUrl: string;
  },
): Promise<EscalationResult> {
  const stale = staleAwaitingApprovalIncidents(args.incidents);
  const alreadyEscalated = await recentlyEscalatedIncidentIds(
    supabase,
    args.organizationId,
    stale.map((incident) => incident.id),
  );
  const candidates = stale.filter((incident) => !alreadyEscalated.has(incident.id));

  if (candidates.length > 0) {
    await postOrgSlackBlocks(
      supabase,
      args.organizationId,
      buildEscalationBlocks(args.orgName, candidates, args.appUrl),
      `Escalation — ${args.orgName}: ${candidates.length} incident(s) awaiting approval`,
    );
    await recordEscalationTimelineEvents(supabase, candidates);
  }

  return { organizationId: args.organizationId, count: candidates.length };
}
