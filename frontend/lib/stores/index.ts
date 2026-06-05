import type { StoreConnector } from "./connect";

export type {
  LoadResult,
  StoreConnection,
  StoreConnector,
  StoreLoadOpts,
  StorePlatform,
} from "./connect";

export interface Store {
  readonly connector: StoreConnector;
}

export { connectStore, getStoreConnection, stores } from "./connect";
