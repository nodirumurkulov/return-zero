import fs from "node:fs";
import path from "node:path";

export const MOCK_STORE_FILES = [
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

export type MockStoreFile = (typeof MOCK_STORE_FILES)[number];
export type MockStoreFiles = Partial<Record<MockStoreFile, string>>;

/** Hugo mock store CSV pack shipped with the repo (hackathon data-pack). */
export class HugoMockStorePack {
  constructor(private readonly dataDir = path.resolve(process.cwd(), "../hackathon/data-pack/data")) {}

  read(): MockStoreFiles {
    return Object.fromEntries(
      MOCK_STORE_FILES.map((file) => {
        const filePath = path.join(this.dataDir, file);
        return [file, fs.readFileSync(filePath, "utf-8")] as const;
      }),
    );
  }
}

export const hugoMockStorePack = new HugoMockStorePack();
