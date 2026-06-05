import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";
import type { LoadResult } from "./connect";
import type { ExternalIdTable } from "./connect/loaders/csv";
import { MockStoreConnector } from "./connect/mock";
import { prettyFlyPack } from "./connect/mock/pack";

import { StoreConnections, type Store } from "./store";

export class MockStore implements Store {
  readonly platform = "mock_csv" as const;
  readonly connector = new MockStoreConnector();
  readonly connections = new StoreConnections();

  async connect(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source?: unknown,
  ): Promise<{ results: LoadResult[]; success: boolean }> {
    const payload = source ?? prettyFlyPack.read();
    const results = await this.connector.load(supabase, organizationId, payload, { replace: true });
    await this.connections.markConnected(supabase, organizationId, this.platform);
    return { results, success: results.every((r) => !r.error) };
  }

  getConnection(supabase: SupabaseClient<Database>, organizationId: string) {
    return this.connections.get(supabase, organizationId);
  }

  fetchExternalIdMap(
    supabase: SupabaseClient<Database>,
    table: ExternalIdTable,
    organizationId: string,
  ): Promise<Map<string, string>> {
    return this.connector.fetchExternalIdMap(supabase, table, organizationId);
  }
}
