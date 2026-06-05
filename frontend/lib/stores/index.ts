import type { StoreConnector } from "./connect/store-connector";

export type {
  LoadResult,
  StoreConnection,
  StoreConnector,
  StoreLoadOpts,
  StorePlatform,
} from "./connect/store-connector";

export interface Store {
  readonly connector: StoreConnector;
}

export {
  connectStore,
  getStoreConnection,
  runStoreIntelligence,
  stores,
} from "./connect/setup";
