import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { Catalog } from "./catalog";
import { StoreConnectionDomain } from "./connection";
import { Import } from "./import/import";
import { Incidents } from "./incidents";
import { Orders } from "./orders";
import { Search } from "./search";

export class Store {
  readonly connection: StoreConnectionDomain;
  readonly import: Import;
  readonly catalog: Catalog;
  readonly orders: Orders;
  readonly incidents: Incidents;
  readonly search: Search;

  constructor(supabase: SupabaseClient<Database>) {
    const incidents = new Incidents(supabase);
    this.connection = new StoreConnectionDomain(supabase);
    this.import = new Import(supabase);
    this.incidents = incidents;
    this.catalog = new Catalog(supabase);
    this.orders = new Orders(supabase, incidents);
    this.search = new Search(supabase);
  }
}

export function getStore(supabase: SupabaseClient<Database>): Store {
  return new Store(supabase);
}
