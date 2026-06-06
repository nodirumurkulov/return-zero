import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

export type InvestigationStepStatus = Database["public"]["Enums"]["investigation_step_status"];

export type InvestigationStepRow = Database["public"]["Tables"]["investigation_steps"]["Row"];

export type InvestigationRunStatus = "idle" | "running" | "complete" | "error";

export type InvestigationStepsSnapshot = {
  run_id: string | null;
  run_status: InvestigationRunStatus;
  steps: InvestigationStepRow[];
};

const TOOL_LABELS: Record<string, string> = {
  getAnomalyProfile: "Checking anomaly profile",
  getRoasReallocation: "Reviewing marketing ROAS",
  getBusinessProfile: "Reading business profile",
};

export function investigationToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? `Calling ${toolName}`;
}

export type InvestigationStepEmitter = {
  readonly runId: string;
  startStep: (args: {
    stepKey: string;
    agentName: string;
    label: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  finishStep: (stepKey: string) => Promise<void>;
  failStep: (stepKey: string, message: string) => Promise<void>;
};

export function createInvestigationRunId(): string {
  return randomUUID();
}

export function createInvestigationStepEmitter(
  supabase: SupabaseClient<Database>,
  args: {
    organizationId: string;
    incidentId: string;
    runId: string;
  },
): InvestigationStepEmitter {
  const upsertStep = async (
    stepKey: string,
    patch: {
      agent_name: string;
      label: string;
      status: InvestigationStepStatus;
      metadata?: Json;
    },
  ) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("investigation_steps").upsert(
      {
        organization_id: args.organizationId,
        incident_id: args.incidentId,
        run_id: args.runId,
        step_key: stepKey,
        agent_name: patch.agent_name,
        label: patch.label,
        status: patch.status,
        metadata: patch.metadata ?? null,
        updated_at: now,
      },
      { onConflict: "run_id,step_key" },
    );
    if (error) {
      return;
    }
  };

  return {
    runId: args.runId,
    startStep: async ({ stepKey, agentName, label, metadata }) => {
      await upsertStep(stepKey, {
        agent_name: agentName,
        label,
        status: "running",
        metadata: metadata as Json | undefined,
      });
    },
    finishStep: async (stepKey) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("investigation_steps")
        .update({ status: "done", updated_at: now })
        .eq("run_id", args.runId)
        .eq("step_key", stepKey);
      if (error) {
        return;
      }
    },
    failStep: async (stepKey, message) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("investigation_steps")
        .update({
          status: "error",
          metadata: { error: message },
          updated_at: now,
        })
        .eq("run_id", args.runId)
        .eq("step_key", stepKey);
      if (error) {
        return;
      }
    },
  };
}

export async function loadLatestInvestigationSteps(
  supabase: SupabaseClient<Database>,
  args: {
    organizationId: string;
    incidentId: string;
    incidentStatus: string;
  },
): Promise<InvestigationStepsSnapshot> {
  const { data: latestRun, error: runError } = await supabase
    .from("investigation_steps")
    .select("run_id")
    .eq("organization_id", args.organizationId)
    .eq("incident_id", args.incidentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runError) {
    throw new Error(`load investigation run: ${runError.message}`);
  }

  if (!latestRun?.run_id) {
    return { run_id: null, run_status: "idle", steps: [] };
  }

  const { data: steps, error: stepsError } = await supabase
    .from("investigation_steps")
    .select("*")
    .eq("run_id", latestRun.run_id)
    .order("created_at", { ascending: true });

  if (stepsError) {
    throw new Error(`load investigation steps: ${stepsError.message}`);
  }

  const rows = steps ?? [];
  const run_status = deriveRunStatus(args.incidentStatus, rows);

  return {
    run_id: latestRun.run_id,
    run_status,
    steps: rows,
  };
}

export function deriveRunStatus(
  incidentStatus: string,
  steps: Pick<InvestigationStepRow, "status">[],
): InvestigationRunStatus {
  if (steps.length === 0) return "idle";
  if (steps.some((step) => step.status === "error")) return "error";
  if (incidentStatus === "investigating") return "running";
  if (steps.some((step) => step.status === "running")) return "running";
  return "complete";
}

export function agentStepHandlers(
  emitter: InvestigationStepEmitter,
  agentName: string,
  prefix: string,
) {
  return {
    experimental_onToolCallStart: async ({
      toolCall,
    }: {
      toolCall: { toolName: string };
    }) => {
      const stepKey = `${prefix}:${toolCall.toolName}`;
      await emitter.startStep({
        stepKey,
        agentName,
        label: investigationToolLabel(toolCall.toolName),
      });
    },
    onStepFinish: async ({
      toolCalls,
    }: {
      toolCalls?: Array<{ toolName: string }>;
    }) => {
      for (const toolCall of toolCalls ?? []) {
        await emitter.finishStep(`${prefix}:${toolCall.toolName}`);
      }
    },
  };
}
