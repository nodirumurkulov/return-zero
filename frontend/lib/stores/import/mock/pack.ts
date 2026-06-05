import fs from "node:fs";
import path from "node:path";

export const PRETTY_FLY_FILES = [
  "collections.csv",
  "suppliers.csv",
  "products.csv",
  "customers.csv",
  "variants.csv",
  "discount_codes.csv",
  "email_campaigns.csv",
  "purchase_orders.csv",
  "bank_transactions.csv",
  "orders.csv",
  "line_items.csv",
  "refunds.csv",
  "inventory_movements.csv",
  "product_collections.csv",
  "addresses.csv",
  "email_events.csv",
  "support_tickets.csv",
  "support_messages.json",
  "po_line_items.csv",
  "meta_ads_daily.csv",
  "google_ads_daily.csv",
] as const;

export type PrettyFlyFile = (typeof PRETTY_FLY_FILES)[number];
export type PrettyFlyFiles = Partial<Record<PrettyFlyFile, string>>;

/** Pretty Fly hackathon data pack shipped with the repo. */
export class PrettyFlyPack {
  constructor(private readonly dataDir = path.resolve(process.cwd(), "../hackathon/data-pack/data")) {}

  read(): PrettyFlyFiles {
    return Object.fromEntries(
      PRETTY_FLY_FILES.map((file) => {
        const filePath = path.join(this.dataDir, file);
        return [file, fs.readFileSync(filePath, "utf-8")] as const;
      }),
    );
  }
}

export const prettyFlyPack = new PrettyFlyPack();
