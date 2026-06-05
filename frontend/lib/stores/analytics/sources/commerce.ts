import type { ProductSourceFacts } from "../metrics/source-facts";

export type CommerceFacts = Pick<
  ProductSourceFacts,
  "sales_revenue" | "sales_units" | "refunds_amount" | "refunds_count"
>;

export function commerceFacts(facts: ProductSourceFacts): CommerceFacts {
  return {
    sales_revenue: facts.sales_revenue,
    sales_units: facts.sales_units,
    refunds_amount: facts.refunds_amount,
    refunds_count: facts.refunds_count,
  };
}
