import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { createIncidents } from "@/lib/stores/incidents";

import {
  buildIncidentDetailContext,
  buildOpenIncidentsContext,
  formatIncidentLine,
  isOpenIncident,
} from "../context";
import { incidentIdInputSchema } from "../schemas";
import type { HugoToolContext } from "./context";

export function createIncidentsTools(ctx: HugoToolContext) {
  return {
    listOpenIncidents: tool({
      description: "List currently open incidents with severity, status, and impact",
      inputSchema: z.object({}),
      execute: async () => {
        const incidents = await createIncidents(ctx.supabase).listIncidents(ctx.organizationId);
        const open = incidents.filter(isOpenIncident);
        return {
          open_count: open.length,
          total_count: incidents.length,
          incidents: open.slice(0, 15).map((inc) => ({
            id: inc.id,
            title: inc.title,
            line: formatIncidentLine(inc),
          })),
          summary: await buildOpenIncidentsContext(ctx.supabase, ctx.organizationId),
        };
      },
    }),
    getIncidentDetail: tool({
      description: "Fetch incident detail including root cause, findings, and proposed actions",
      inputSchema: incidentIdInputSchema,
      execute: async ({ incidentId }) => {
        const detail = await createIncidents(ctx.supabase).getIncidentDetail(
          incidentId,
          ctx.organizationId,
        );
        if (!detail) {
          return { found: false as const };
        }
        return {
          found: true as const,
          incident_id: detail.incident.id,
          title: detail.incident.title,
          status: detail.incident.status,
          product_id: detail.incident.product_id,
          summary: buildIncidentDetailContext(detail),
        };
      },
    }),
  };
}
