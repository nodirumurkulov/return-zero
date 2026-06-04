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
  _incidentId: string,
  productId: string,
): Promise<InvestigationResult> {
  const [returns, merch, marketing, inventory, forecasting] = await Promise.all([
    runReturnsAgent(supabase, productId),
    runMerchandisingAgent(supabase, productId),
    runMarketingAgent(supabase, productId),
    runInventoryAgent(supabase, productId),
    runForecastingAgent(supabase, productId),
  ]);

  const findings = [returns, merch, marketing, inventory, forecasting];
  const { root_cause, root_cause_confidence, actions } = await synthesiseRootCause(findings);

  return { findings, root_cause, root_cause_confidence, actions };
}
