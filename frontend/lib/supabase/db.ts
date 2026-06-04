import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type { Database, Json } from "./database.types";
export type { Tables, Views } from "./database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;
