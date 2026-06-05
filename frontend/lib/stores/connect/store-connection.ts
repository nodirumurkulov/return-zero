import type { Enums, Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/db";

export type StorePlatform = Enums<"store_platform">;
export type StoreSyncMode = Enums<"store_sync_mode">;
export type StoreConnectionStatus = Enums<"store_connection_status">;

/** One active store connection per organization (`store_connections` table). */
export type StoreConnection = Tables<"store_connections">;
export type StoreConnectionInsert = TablesInsert<"store_connections">;
export type StoreConnectionUpdate = TablesUpdate<"store_connections">;
