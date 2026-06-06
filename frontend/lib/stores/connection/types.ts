import type { z } from "zod";

import type { StoreScope } from "@/lib/tenancy/types";

import type {
  connectStoreBodySchema,
  storeConnectionPhaseSchema,
  storeConnectionResponseSchema,
  storeConnectionSnapshotSchema,
  storeConnectionStatusSchema,
  storePlatformSchema,
} from "./schemas";

export type StorePlatform = z.infer<typeof storePlatformSchema>;
export type StoreConnectionStatus = z.infer<typeof storeConnectionStatusSchema>;
export type StoreConnectionPhase = z.infer<typeof storeConnectionPhaseSchema>;
export type StoreConnectionSnapshot = z.infer<typeof storeConnectionSnapshotSchema>;
export type StoreConnectionResponse = z.infer<typeof storeConnectionResponseSchema>;
export type ConnectStoreBody = z.infer<typeof connectStoreBodySchema>;

export type ConnectOutcome = "started" | "already_syncing" | "already_connected";

export type ConnectResult = {
  snapshot: StoreConnectionSnapshot;
  outcome: ConnectOutcome;
};

export type ConnectionSnapshotOpts = {
  scope: StoreScope;
};

export type ConnectionConnectOpts = {
  scope: StoreScope;
  platform: StorePlatform;
};
