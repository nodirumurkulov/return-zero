import type { StoreScope } from "@/lib/tenancy/types";

export type SearchTarget = {
  id: string;
  label: string;
  href: string;
  kind: "product" | "incident";
};

export type SearchListOpts = {
  scope: StoreScope;
  query?: string;
};
