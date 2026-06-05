import type { SupabaseClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { z } from "zod";

import type { Database, TablesInsert } from "@/lib/supabase/db";
import type { ImportTableResult } from "../types";

export type ContractTable =
  | "collections"
  | "suppliers"
  | "products"
  | "customers"
  | "variants"
  | "discount_codes"
  | "email_campaigns"
  | "purchase_orders"
  | "bank_transactions"
  | "orders"
  | "line_items"
  | "refunds"
  | "inventory_movements"
  | "product_collections"
  | "addresses"
  | "email_events"
  | "support_tickets"
  | "support_messages"
  | "po_line_items"
  | "meta_ads_daily"
  | "google_ads_daily";

export type ExternalIdTable = Exclude<
  ContractTable,
  "product_collections" | "meta_ads_daily" | "google_ads_daily"
>;

/** Type-safe CSV/JSON parsing and batched Supabase upserts for store loaders. */
export class CsvLoader {
  constructor(private readonly batchSize = 500) {}

  parse(text: string): Record<string, unknown>[] {
    return parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
    }) as Record<string, unknown>[];
  }

  parseRows<T extends z.ZodType>(schema: T, csv: string): z.infer<T>[] {
    return z.array(schema).parse(this.parse(csv));
  }

  parseJsonRows<T extends z.ZodType>(schema: T, json: string): z.infer<T>[] {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) throw new Error("expected JSON array");
    return z.array(schema).parse(parsed);
  }

  async upsert<T extends ContractTable>(
    supabase: SupabaseClient<Database>,
    table: T,
    rows: TablesInsert<T>[],
    onConflict: string,
  ): Promise<ImportTableResult> {
    if (rows.length === 0) return { table, count: 0 };

    const chunks = Array.from({ length: Math.ceil(rows.length / this.batchSize) }, (_, index) =>
      rows.slice(index * this.batchSize, index * this.batchSize + this.batchSize),
    );

    for (const [index, chunk] of chunks.entries()) {
      const query = supabase.from(table);
      const { error } = await query.upsert(chunk as Parameters<typeof query.upsert>[0], { onConflict });
      if (error) return { table, count: index * this.batchSize, error: error.message };
    }

    return { table, count: rows.length };
  }

  async fetchExternalIdMap(
    supabase: SupabaseClient<Database>,
    table: ExternalIdTable,
    organizationId: string,
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const pageSize = 1000;

    const loadPage = async (offset: number): Promise<void> => {
      const { data, error } = await supabase
        .from(table)
        .select("id, external_id")
        .eq("organization_id", organizationId)
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(`fetchExternalIdMap ${table}: ${error.message}`);
      if (!data?.length) return;
      for (const row of data) {
        if (row.external_id != null) map.set(String(row.external_id), String(row.id));
      }
      if (data.length >= pageSize) await loadPage(offset + pageSize);
    };

    await loadPage(0);
    return map;
  }
}

export const csvLoader = new CsvLoader();
