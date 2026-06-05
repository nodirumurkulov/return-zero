import "server-only";

import { tool } from "ai";

import { formatIncidentLine, resolveIncident } from "../context";
import { resolveReferenceInputSchema } from "../schemas";
import type { HugoToolContext } from "./context";

export function createResolveReferenceTools(ctx: HugoToolContext) {
  return {
    resolveIncidentReference: tool({
      description:
        "Resolve a free-text incident reference (title fragment, product id, or incident id) to one incident or candidate list",
      inputSchema: resolveReferenceInputSchema,
      execute: async ({ reference }) => {
        const { match, candidates } = await resolveIncident(
          ctx.supabase,
          reference,
          ctx.organizationId,
        );
        return {
          match: match
            ? { id: match.id, title: match.title, line: formatIncidentLine(match) }
            : null,
          candidates: candidates.slice(0, 8).map((c) => ({
            id: c.id,
            title: c.title,
            line: formatIncidentLine(c),
          })),
        };
      },
    }),
  };
}
