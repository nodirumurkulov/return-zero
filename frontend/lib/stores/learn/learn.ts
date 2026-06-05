import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { Orders } from "../orders/orders";
import { learnBaselines, type LearnResult } from "./baselines";
import { seedBusinessProfileFromStore } from "./business-profile";
import { buildBusinessReport } from "./report";
import type { ReportSummary } from "./schemas";

export type LearnRunOpts = {
  organizationId: string;
};

export type LearnRunResult = {
  learn: LearnResult;
  reportId: string;
  replayCursor: string;
};

export class Learn {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orders: Orders,
  ) {}

  async run(opts: LearnRunOpts): Promise<LearnRunResult> {
    await seedBusinessProfileFromStore(this.supabase, opts.organizationId);
    const learn = await learnBaselines(this.supabase, opts.organizationId, this.orders);
    const report = await buildBusinessReport(this.supabase, opts.organizationId);
    const { cursor: replayCursor } = await this.orders.reset({ organizationId: opts.organizationId });
    return { learn, reportId: report.id, replayCursor };
  }

  async baseline(opts: LearnRunOpts): Promise<LearnResult> {
    return learnBaselines(this.supabase, opts.organizationId, this.orders);
  }

  async report(opts: LearnRunOpts): Promise<{ id: string; summary: ReportSummary }> {
    return buildBusinessReport(this.supabase, opts.organizationId);
  }

  async seed(opts: LearnRunOpts): Promise<void> {
    await seedBusinessProfileFromStore(this.supabase, opts.organizationId);
  }
}
