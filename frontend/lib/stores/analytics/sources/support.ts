import type { ProductSourceFacts } from "../metrics/source-facts";

export type SupportFacts = Pick<ProductSourceFacts, "support_count">;

export function supportFacts(facts: ProductSourceFacts): SupportFacts {
  return { support_count: facts.support_count };
}
