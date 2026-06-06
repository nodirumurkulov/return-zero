import type { z } from "zod";

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
  organizationId: string;
};

export type ConnectionConnectOpts = {
  organizationId: string;
  platform: StorePlatform;
};
