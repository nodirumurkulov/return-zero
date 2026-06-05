import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { Catalog } from "./catalog";
import { Import } from "./import";
import { Incidents } from "./incidents";
import { Learn } from "./learn";
import { Orders } from "./orders";
import { Search } from "./search";

export class Store {
  readonly import: Import;
  readonly catalog: Catalog;
  readonly orders: Orders;
  readonly incidents: Incidents;
  readonly learn: Learn;
  readonly search: Search;

  constructor(supabase: SupabaseClient<Database>) {
    const incidents = new Incidents(supabase);
    this.import = new Import(supabase);
    this.incidents = incidents;
    this.catalog = new Catalog(supabase);
    this.orders = new Orders(supabase, incidents);
    this.learn = new Learn(supabase, this.orders);
    this.search = new Search(supabase);
  }
}

export function getStore(supabase: SupabaseClient<Database>): Store {
  return new Store(supabase);
}
