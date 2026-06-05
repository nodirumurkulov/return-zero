import type { SupabaseClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

import {
  TABLE_SPECS,
  type ForeignKeySpec,
  type ForeignRefTable,
  type TableSpec,
} from "./schemas";

const BATCH = 500;
type Row = Record<string, unknown>;

export interface LoadResult {
  table: string;
  count: number;
  error?: string;
}

interface IdMaps {
  collections: Map<string, string>;
  collectionsByTitle: Map<string, string>;
  products: Map<string, string>;
  customers: Map<string, string>;
  variants: Map<string, string>;
  orders: Map<string, string>;
  purchase_orders: Map<string, string>;
}

export function parseCsv(text: string): Row[] {
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: true,
  }) as Row[];
}

function coerceBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function mapScalar(spec: TableSpec, dbColumn: string, raw: unknown): unknown {
  if ((spec.booleans ?? []).includes(dbColumn)) return coerceBool(raw);
  if ((spec.nullable ?? []).includes(dbColumn) && isEmpty(raw)) return null;
  if ((spec.jsonb ?? []).includes(dbColumn)) {
    if (isEmpty(raw)) return [];
    if (typeof raw === "string") return JSON.parse(raw) as unknown;
    return raw;
  }
  return raw;
}

function conflictTarget(spec: TableSpec): string {
  if (spec.conflictColumns) {
    return ["organization_id", ...spec.conflictColumns].join(",");
  }
  return "organization_id,external_id";
}

function resolveForeignKey(
  fk: ForeignKeySpec,
  raw: unknown,
  maps: IdMaps,
): string | null {
  if (isEmpty(raw)) return null;

  const externalId = String(raw);
  if (fk.refTable === "collections") {
    const byExternal = maps.collections.get(externalId);
    if (byExternal) return byExternal;
    if (fk.matchCollectionTitle) {
      return maps.collectionsByTitle.get(externalId) ?? null;
    }
    return null;
  }

  const tableMap: Record<Exclude<ForeignRefTable, "collections">, Map<string, string>> = {
    products: maps.products,
    customers: maps.customers,
    variants: maps.variants,
    orders: maps.orders,
    purchase_orders: maps.purchase_orders,
  };

  return tableMap[fk.refTable].get(externalId) ?? null;
}

function buildRows(
  spec: TableSpec,
  csvRows: Row[],
  organizationId: string,
  maps: IdMaps,
): Row[] {
  const fkDbColumns = new Set((spec.foreignKeys ?? []).map((fk) => fk.db));

  return csvRows
    .filter((row) => {
      if (!spec.externalIdColumn) return true;
      return !isEmpty(row[spec.externalIdColumn]);
    })
    .flatMap((row) => {
      const mapped = spec.columns.reduce<Row>((acc, { csv, db }) => {
        if (fkDbColumns.has(db)) return acc;
        return { ...acc, [db]: mapScalar(spec, db, row[csv]) };
      }, { organization_id: organizationId });

      for (const fk of spec.foreignKeys ?? []) {
        const resolved = resolveForeignKey(fk, row[fk.csv], maps);
        if (resolved === null && !isEmpty(row[fk.csv])) {
          return [];
        }
        mapped[fk.db] = resolved;
      }

      return [mapped];
    });
}

async function refreshIdMap(
  supabase: SupabaseClient,
  table: string,
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
    if (error) throw new Error(`refresh ${table} id map: ${error.message}`);
    if (!data?.length) return;
    for (const row of data) {
      map.set(String(row.external_id), String(row.id));
    }
    if (data.length >= pageSize) await loadPage(offset + pageSize);
  };

  await loadPage(0);
  return map;
}

async function refreshCollectionMaps(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<Pick<IdMaps, "collections" | "collectionsByTitle">> {
  const collections = new Map<string, string>();
  const collectionsByTitle = new Map<string, string>();
  const pageSize = 1000;

  const loadPage = async (offset: number): Promise<void> => {
    const { data, error } = await supabase
      .from("collections")
      .select("id, external_id, title")
      .eq("organization_id", organizationId)
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`refresh collections id map: ${error.message}`);
    if (!data?.length) return;
    for (const row of data) {
      collections.set(String(row.external_id), String(row.id));
      if (row.title) collectionsByTitle.set(String(row.title), String(row.id));
    }
    if (data.length >= pageSize) await loadPage(offset + pageSize);
  };

  await loadPage(0);
  return { collections, collectionsByTitle };
}

async function refreshMapsForTable(
  supabase: SupabaseClient,
  table: string,
  organizationId: string,
  maps: IdMaps,
): Promise<void> {
  if (table === "collections") {
    const next = await refreshCollectionMaps(supabase, organizationId);
    maps.collections = next.collections;
    maps.collectionsByTitle = next.collectionsByTitle;
    return;
  }

  const mappable: Partial<Record<string, keyof IdMaps>> = {
    products: "products",
    customers: "customers",
    variants: "variants",
    orders: "orders",
    purchase_orders: "purchase_orders",
  };

  const mapKey = mappable[table];
  if (mapKey) {
    maps[mapKey] = await refreshIdMap(supabase, table, organizationId);
  }
}

async function upsertTable(
  supabase: SupabaseClient,
  spec: TableSpec,
  rows: Row[],
): Promise<LoadResult> {
  if (rows.length === 0) return { table: spec.table, count: 0 };

  const chunks = Array.from({ length: Math.ceil(rows.length / BATCH) }, (_, index) =>
    rows.slice(index * BATCH, index * BATCH + BATCH),
  );

  for (const [index, chunk] of chunks.entries()) {
    const { error } = await supabase
      .from(spec.table)
      .upsert(chunk, { onConflict: conflictTarget(spec) });
    if (error) {
      return { table: spec.table, count: index * BATCH, error: error.message };
    }
  }

  return { table: spec.table, count: rows.length };
}

/**
 * Load contract CSVs for an organization. Pass 1: collections, products, customers,
 * variants, purchase_orders. Pass 2: child tables with FK resolution from external_id maps.
 */
export async function loadContractData(
  supabase: SupabaseClient,
  organizationId: string,
  csvFiles: Record<string, string>,
  opts: { replace?: boolean } = {},
): Promise<LoadResult[]> {
  if (opts.replace) {
    const { error } = await supabase.rpc("reset_organization_data", {
      p_organization_id: organizationId,
    });
    if (error) throw new Error(`reset_organization_data: ${error.message}`);
  }

  const maps: IdMaps = {
    collections: new Map(),
    collectionsByTitle: new Map(),
    products: new Map(),
    customers: new Map(),
    variants: new Map(),
    orders: new Map(),
    purchase_orders: new Map(),
  };

  const available = TABLE_SPECS.filter((spec) => csvFiles[spec.file] != null);
  const results: LoadResult[] = [];

  for (const pass of [1, 2] as const) {
    for (const spec of available.filter((entry) => entry.pass === pass)) {
      const rows = buildRows(spec, parseCsv(csvFiles[spec.file]), organizationId, maps);
      results.push(await upsertTable(supabase, spec, rows));
      await refreshMapsForTable(supabase, spec.table, organizationId, maps);
    }
  }

  return results;
}

/** External id → uuid map for a loaded contract table (post-load helper for seed/scripts). */
export async function fetchExternalIdMap(
  supabase: SupabaseClient,
  table: string,
  organizationId: string,
): Promise<Map<string, string>> {
  return refreshIdMap(supabase, table, organizationId);
}
