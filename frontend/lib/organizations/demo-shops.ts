export type DemoShop = {
  id: string;
  name: string;
  plan: string;
  logoSrc?: string;
};

export const DEMO_SHOPS: DemoShop[] = [
  {
    id: "pretty-fly",
    name: "Pretty Fly",
    plan: "Demo store",
  },
];
