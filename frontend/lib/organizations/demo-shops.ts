import {
  HUGO_MOCK_STORE_ID,
  HUGO_MOCK_STORE_NAME,
} from "@/lib/organizations/mock-store";

export type DemoShop = {
  id: string;
  name: string;
  plan: string;
  logoSrc?: string;
};

export const DEMO_SHOPS: DemoShop[] = [
  {
    id: HUGO_MOCK_STORE_ID,
    name: HUGO_MOCK_STORE_NAME,
    plan: "Mock store",
    logoSrc: "/catLogo.png",
  },
];
