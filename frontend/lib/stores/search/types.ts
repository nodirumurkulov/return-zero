export type SearchTarget = {
  id: string;
  label: string;
  href: string;
  kind: "product" | "incident";
};

export type SearchListOpts = {
  organizationId: string;
  query?: string;
};
