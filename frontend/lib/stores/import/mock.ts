import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";


import { type ExternalIdTable, csvLoader } from "./loaders/csv";
import { IdMapCache } from "./mock/id-maps";
import type { PrettyFlyFiles } from "./mock/pack";
import { type IdMaps, prettyFlyRows } from "./mock/rows";
import type { ImportLoadOpts, ImportTableResult, ImportLoader } from ".";

export type { PrettyFlyFile, PrettyFlyFiles } from "./mock/pack";

export class MockImportLoader implements ImportLoader {
  readonly platform = "mock_csv" as const;

  private readonly loader = csvLoader;
  private readonly rows = prettyFlyRows;

  async load(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source: unknown,
    opts?: ImportLoadOpts,
  ): Promise<ImportTableResult[]> {
    const files = source as PrettyFlyFiles;
    if (opts?.replace) {
      const { error } = await supabase.rpc("reset_organization_data", {
        p_organization_id: organizationId,
      });
      if (error) throw new Error(`reset_organization_data: ${error.message}`);
    }

    const maps = new IdMapCache();
    const parents = await this.loadParents(supabase, organizationId, files, maps);
    const children = await this.loadChildren(supabase, organizationId, files, maps);
    return [...parents, ...children];
  }

  fetchExternalIdMap(
    supabase: SupabaseClient<Database>,
    table: ExternalIdTable,
    organizationId: string,
  ): Promise<Map<string, string>> {
    return this.loader.fetchExternalIdMap(supabase, table, organizationId);
  }

  private async refreshIdMap(
    supabase: SupabaseClient<Database>,
    table: keyof IdMaps,
    organizationId: string,
    maps: IdMapCache,
  ): Promise<void> {
    if (table === "collections" || table === "collectionsByTitle") {
      await maps.refreshCollections(supabase, organizationId);
      return;
    }
    maps[table] = await this.loader.fetchExternalIdMap(supabase, table, organizationId);
  }

  private async loadParents(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    files: PrettyFlyFiles,
    maps: IdMapCache,
  ): Promise<ImportTableResult[]> {
    const { schema } = this.rows;
    const results: ImportTableResult[] = [];

    const collections = files["collections.csv"];
    if (collections != null) {
      const result = await this.loader.upsert(
        supabase,
        "collections",
        this.rows.mapCollectionRows(
          this.loader.parseRows(schema.prettyFlyCollectionRowSchema, collections),
          organizationId,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "collections", organizationId, maps);
      results.push(result);
    }

    const suppliers = files["suppliers.csv"];
    if (suppliers != null) {
      const result = await this.loader.upsert(
        supabase,
        "suppliers",
        this.rows.mapSupplierRows(
          this.loader.parseRows(schema.prettyFlySupplierRowSchema, suppliers),
          organizationId,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "suppliers", organizationId, maps);
      results.push(result);
    }

    const products = files["products.csv"];
    if (products != null) {
      const result = await this.loader.upsert(
        supabase,
        "products",
        this.rows.mapProductRows(
          this.loader.parseRows(schema.prettyFlyProductRowSchema, products),
          organizationId,
          maps,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "products", organizationId, maps);
      results.push(result);
    }

    const customers = files["customers.csv"];
    if (customers != null) {
      const result = await this.loader.upsert(
        supabase,
        "customers",
        this.rows.mapCustomerRows(
          this.loader.parseRows(schema.prettyFlyCustomerRowSchema, customers),
          organizationId,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "customers", organizationId, maps);
      results.push(result);
    }

    const variants = files["variants.csv"];
    if (variants != null) {
      const result = await this.loader.upsert(
        supabase,
        "variants",
        this.rows.mapVariantRows(
          this.loader.parseRows(schema.prettyFlyVariantRowSchema, variants),
          organizationId,
          maps,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "variants", organizationId, maps);
      results.push(result);
    }

    const discountCodes = files["discount_codes.csv"];
    if (discountCodes != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "discount_codes",
          this.rows.mapDiscountCodeRows(
            this.loader.parseRows(schema.prettyFlyDiscountCodeRowSchema, discountCodes),
            organizationId,
          ),
          "organization_id,external_id",
        ),
      );
    }

    const emailCampaigns = files["email_campaigns.csv"];
    if (emailCampaigns != null) {
      const result = await this.loader.upsert(
        supabase,
        "email_campaigns",
        this.rows.mapEmailCampaignRows(
          this.loader.parseRows(schema.prettyFlyEmailCampaignRowSchema, emailCampaigns),
          organizationId,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "email_campaigns", organizationId, maps);
      results.push(result);
    }

    const purchaseOrders = files["purchase_orders.csv"];
    if (purchaseOrders != null) {
      const result = await this.loader.upsert(
        supabase,
        "purchase_orders",
        this.rows.mapPurchaseOrderRows(
          this.loader.parseRows(schema.prettyFlyPurchaseOrderRowSchema, purchaseOrders),
          organizationId,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "purchase_orders", organizationId, maps);
      results.push(result);
    }

    const bankTransactions = files["bank_transactions.csv"];
    if (bankTransactions != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "bank_transactions",
          this.rows.mapBankTransactionRows(
            this.loader.parseRows(schema.prettyFlyBankTransactionRowSchema, bankTransactions),
            organizationId,
          ),
          "organization_id,external_id",
        ),
      );
    }

    return results;
  }

  private async loadChildren(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    files: PrettyFlyFiles,
    maps: IdMapCache,
  ): Promise<ImportTableResult[]> {
    const { schema } = this.rows;
    const results: ImportTableResult[] = [];

    const orders = files["orders.csv"];
    if (orders != null) {
      const result = await this.loader.upsert(
        supabase,
        "orders",
        this.rows.mapOrderRows(
          this.loader.parseRows(schema.prettyFlyOrderRowSchema, orders),
          organizationId,
          maps,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "orders", organizationId, maps);
      results.push(result);
    }

    const lineItems = files["line_items.csv"];
    if (lineItems != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "line_items",
          this.rows.mapLineItemRows(
            this.loader.parseRows(schema.prettyFlyLineItemRowSchema, lineItems),
            organizationId,
            maps,
          ),
          "organization_id,external_id",
        ),
      );
    }

    const refunds = files["refunds.csv"];
    if (refunds != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "refunds",
          this.rows.mapRefundRows(
            this.loader.parseRows(schema.prettyFlyRefundRowSchema, refunds),
            organizationId,
            maps,
          ),
          "organization_id,external_id",
        ),
      );
    }

    const inventoryMovements = files["inventory_movements.csv"];
    if (inventoryMovements != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "inventory_movements",
          this.rows.mapInventoryMovementRows(
            this.loader.parseRows(schema.prettyFlyInventoryMovementRowSchema, inventoryMovements),
            organizationId,
            maps,
          ),
          "organization_id,external_id",
        ),
      );
    }

    const productCollections = files["product_collections.csv"];
    if (productCollections != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "product_collections",
          this.rows.mapProductCollectionRows(
            this.loader.parseRows(schema.prettyFlyProductCollectionRowSchema, productCollections),
            organizationId,
            maps,
          ),
          "organization_id,product_id,collection_id",
        ),
      );
    }

    const addresses = files["addresses.csv"];
    if (addresses != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "addresses",
          this.rows.mapAddressRows(
            this.loader.parseRows(schema.prettyFlyAddressRowSchema, addresses),
            organizationId,
            maps,
          ),
          "organization_id,external_id",
        ),
      );
    }

    const emailEvents = files["email_events.csv"];
    if (emailEvents != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "email_events",
          this.rows.mapEmailEventRows(
            this.loader.parseRows(schema.prettyFlyEmailEventRowSchema, emailEvents),
            organizationId,
            maps,
          ),
          "organization_id,external_id",
        ),
      );
    }

    const supportTickets = files["support_tickets.csv"];
    if (supportTickets != null) {
      const result = await this.loader.upsert(
        supabase,
        "support_tickets",
        this.rows.mapSupportTicketRows(
          this.loader.parseRows(schema.prettyFlySupportTicketRowSchema, supportTickets),
          organizationId,
          maps,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "support_tickets", organizationId, maps);
      results.push(result);
    }

    const supportMessages = files["support_messages.json"];
    if (supportMessages != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "support_messages",
          this.rows.mapSupportMessageRows(
            this.loader.parseJsonRows(schema.prettyFlySupportMessageRowSchema, supportMessages),
            organizationId,
            maps,
          ),
          "organization_id,external_id",
        ),
      );
    }

    const poLineItems = files["po_line_items.csv"];
    if (poLineItems != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "po_line_items",
          this.rows.mapPoLineItemRows(
            this.loader.parseRows(schema.prettyFlyPoLineItemRowSchema, poLineItems),
            organizationId,
            maps,
          ),
          "organization_id,external_id",
        ),
      );
    }

    const metaAds = files["meta_ads_daily.csv"];
    if (metaAds != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "meta_ads_daily",
          this.rows.mapMetaAdsDailyRows(
            this.loader.parseRows(schema.prettyFlyMetaAdsDailyRowSchema, metaAds),
            organizationId,
          ),
          "organization_id,date,campaign_name,ad_name,placement",
        ),
      );
    }

    const googleAds = files["google_ads_daily.csv"];
    if (googleAds != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "google_ads_daily",
          this.rows.mapGoogleAdsDailyRows(
            this.loader.parseRows(schema.prettyFlyGoogleAdsDailyRowSchema, googleAds),
            organizationId,
          ),
          "organization_id,date,campaign_name,ad_group",
        ),
      );
    }

    return results;
  }
}
