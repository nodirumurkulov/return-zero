import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { listSearchTargets } from "./queries";
import type { SearchTarget } from "./types";

export type SearchListOpts = {
  organizationId: string;
  query?: string;
};

export class Search {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(opts: SearchListOpts): Promise<SearchTarget[]> {
    const targets = await listSearchTargets(this.supabase, opts.organizationId);
    if (!opts.query?.trim()) return targets;
    const q = opts.query.trim().toLowerCase();
    return targets.filter((t) => t.label.toLowerCase().includes(q));
  }
}
