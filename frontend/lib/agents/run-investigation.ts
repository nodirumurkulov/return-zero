import "server-only";
import { runForecastingAgent } from "./forecasting";
import { runInventoryAgent } from "./inventory";
import { runMarketingAgent } from "./marketing";
import { runMerchandisingAgent } from "./merchandising";
import { runReturnsAgent } from "./returns";
import { synthesiseRootCause } from "./synthesise";
import type { AgentSupabase, InvestigationResult } from "./types";

export async function runInvestigation(
  supabase: AgentSupabase,
  organizationId: string,
  _incidentId: string,
  productId: string,
  affectedKpiKeys: string[],
): Promise<InvestigationResult> {
  const [returns, merch, marketing, inventory, forecasting] = await Promise.all([
    runReturnsAgent(supabase, organizationId, productId),
    runMerchandisingAgent(supabase, organizationId, productId),
    runMarketingAgent(supabase, organizationId, productId),
    runInventoryAgent(supabase, organizationId, productId),
    runForecastingAgent(supabase, organizationId, productId),
  ]);

  const findings = [returns, merch, marketing, inventory, forecasting];
  const { root_cause, root_cause_confidence, actions } = await synthesiseRootCause(
    findings,
    affectedKpiKeys,
  );

  return { findings, root_cause, root_cause_confidence, actions };
}
