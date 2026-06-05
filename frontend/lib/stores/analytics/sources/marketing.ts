import type { ProductSourceFacts } from "../metrics/source-facts";

export type MarketingFacts = Pick<ProductSourceFacts, "ads_spend" | "ads_revenue">;

export function marketingFacts(facts: ProductSourceFacts): MarketingFacts {
  return { ads_spend: facts.ads_spend, ads_revenue: facts.ads_revenue };
}
