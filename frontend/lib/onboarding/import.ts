import type { SupabaseClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

import { stageFutureStream } from "@/lib/detection/replay-clock";
import { TABLE_SPECS, type TableSpec } from "./schemas";

// Import uploaded CSVs into the contract tables. Mirrors frontend/scripts/seed.ts
// (batch upsert/insert, csv-parse with cast) but driven by the uploaded files.

const BATCH = 500;
type Row = Record<string, unknown>;

export function parseCsv(text: string): Row[] {
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: true,
  }) as Row[];
}

function coerceBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return Boolean(v);
}

function mapValue(spec: TableSpec, col: string, raw: unknown): unknown {
  if ((spec.booleans ?? []).includes(col)) return coerceBool(raw);
  if ((spec.nullable ?? []).includes(col) && (raw === "" || raw === undefined)) return null;
  return raw;
}

/** Pick the allow-listed columns (with null/boolean coercions); drop rows missing the key. */
export function mapRows(spec: TableSpec, rows: Row[]): Row[] {
  return rows
    .filter((r) => {
      if (!spec.key) return true;
      const k = r[spec.key];
      return k !== undefined && k !== null && k !== "";
    })
    .map((r) => spec.columns.reduce<Row>((acc, col) => ({ ...acc, [col]: mapValue(spec, col, r[col]) }), {}));
}

export interface ImportResult {
  table: string;
  count: number;
  error?: string;
}

async function loadTable(supabase: SupabaseClient, spec: TableSpec, rows: Row[]): Promise<ImportResult> {
  const chunks = Array.from({ length: Math.ceil(rows.length / BATCH) }, (_, i) =>
    rows.slice(i * BATCH, i * BATCH + BATCH)
  );
  for (const [idx, chunk] of chunks.entries()) {
    const { error } = spec.key
      ? await supabase.from(spec.table).upsert(chunk, { onConflict: spec.key })
      : await supabase.from(spec.table).insert(chunk);
    if (error) return { table: spec.table, count: idx * BATCH, error: error.message };
  }
  return { table: spec.table, count: rows.length };
}

/**
 * Import the provided files (field name -> CSV text) into the contract tables.
 * Loads in FK-safe order (TABLE_SPECS order). With `replace`, truncates first.
 */
export async function importContractData(
  supabase: SupabaseClient,
  files: Record<string, string>,
  opts: { replace?: boolean } = {}
): Promise<ImportResult[]> {
  if (files["orders.csv"] != null && files["customers.csv"] == null) {
    throw new Error("orders.csv requires customers.csv — staged orders need customer rows for replay ingest");
  }

  if (opts.replace) {
    const { error } = await supabase.rpc("reset_contract_data");
    if (error) throw new Error(`reset_contract_data: ${error.message}`);
  }

  const specs = TABLE_SPECS.filter((s) => files[s.file] != null);
  const results: ImportResult[] = [];
  for (const spec of specs) {
    results.push(await loadTable(supabase, spec, mapRows(spec, parseCsv(files[spec.file]))));
  }

  const failed = results.find((r) => r.error);
  if (failed) return results;

  if (files["orders.csv"] != null) {
    await stageFutureStream(supabase);
  }

  return results;
}
