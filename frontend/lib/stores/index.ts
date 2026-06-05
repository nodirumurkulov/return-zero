export type {
  LoadResult,
  Store,
  StoreConnection,
  StoreConnector,
  StoreLoadOpts,
  StorePlatform,
} from "./connect";
export { StoreConnections } from "./connect";
export { MockStore, MockStoreConnector } from "./connect/mock";
export type { PrettyFlyFile, PrettyFlyFiles } from "./connect/mock";
export { ShopifyStore, ShopifyStoreConnector } from "./connect/shopify";
