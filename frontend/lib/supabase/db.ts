import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;
