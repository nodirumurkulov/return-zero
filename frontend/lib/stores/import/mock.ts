import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";

import { resetActiveStoreData, resolveActiveStoreId } from "../connection/reset-store-data";

import { type ExternalIdTable, csvLoader } from "./loaders/csv";
import { IdMapCache } from "./mock/id-maps";
import type { MockStoreFiles } from "./mock/pack";
import { type IdMaps, mockStoreRows } from "./mock/rows";
import type { ImportLoadOpts, ImportLoader, ImportTableResult } from "./types";

export type { MockStoreFile, MockStoreFiles } from "./mock/pack";

export class MockImportLoader implements ImportLoader {
  readonly platform = "mock_csv" as const;

  private readonly loader = csvLoader;
  private readonly rows = mockStoreRows;

  private withStoreId<T extends { organization_id: string }>(
    rows: T[],
    storeId: string,
  ): (T & { store_id: string })[] {
    return rows.map((row) => ({ ...row, store_id: storeId }));
  }

  async load(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source: unknown,
    opts?: ImportLoadOpts,
  ): Promise<ImportTableResult[]> {
    const files = source as MockStoreFiles;
    const storeId = await resolveActiveStoreId(supabase, organizationId);
    if (opts?.replace) {
      await resetActiveStoreData(supabase, organizationId);
    }

    const { results: catalogResults, maps } = await this.loadCatalogPhase(
      supabase,
      organizationId,
      storeId,
      files,
    );
    const commerceResults = await this.loadCommercePhase(
      supabase,
      organizationId,
      storeId,
      files,
      maps,
    );
    return [...catalogResults, ...commerceResults];
  }

  async loadCatalogPhase(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    storeId: string,
    source: unknown,
    existingMaps?: IdMapCache,
  ): Promise<{ results: ImportTableResult[]; maps: IdMapCache }> {
    const files = source as MockStoreFiles;
    const maps = existingMaps ?? new IdMapCache();
    const results = await this.loadCatalogTables(supabase, organizationId, storeId, files, maps);
    return { results, maps };
  }

  async loadCommercePhase(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    storeId: string,
    source: unknown,
    maps: IdMapCache,
  ): Promise<ImportTableResult[]> {
    const files = source as MockStoreFiles;
    const parentResults = await this.loadCommerceParents(
      supabase,
      organizationId,
      storeId,
      files,
      maps,
    );
    const childResults = await this.loadCommerceChildren(
      supabase,
      organizationId,
      storeId,
      files,
      maps,
    );
    return [...parentResults, ...childResults];
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

  private async loadCatalogTables(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    storeId: string,
    files: MockStoreFiles,
    maps: IdMapCache,
  ): Promise<ImportTableResult[]> {
    const { schema } = this.rows;
    const results: ImportTableResult[] = [];

    const collections = files["collections.csv"];
    if (collections != null) {
      const result = await this.loader.upsert(
        supabase,
        "collections",
        this.withStoreId(
          this.rows.mapCollectionRows(
          this.loader.parseRows(schema.mockStoreCollectionRowSchema, collections),
          organizationId,
        ),
          storeId,
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
        this.withStoreId(
          this.rows.mapSupplierRows(
          this.loader.parseRows(schema.mockStoreSupplierRowSchema, suppliers),
          organizationId,
        ),
          storeId,
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
        this.withStoreId(
          this.rows.mapProductRows(
          this.loader.parseRows(schema.mockStoreProductRowSchema, products),
          organizationId,
          maps,
        ),
          storeId,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "products", organizationId, maps);
      results.push(result);
    }

    const variants = files["variants.csv"];
    if (variants != null) {
      const result = await this.loader.upsert(
        supabase,
        "variants",
        this.withStoreId(
          this.rows.mapVariantRows(
          this.loader.parseRows(schema.mockStoreVariantRowSchema, variants),
          organizationId,
          maps,
        ),
          storeId,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "variants", organizationId, maps);
      results.push(result);
    }

    const productCollections = files["product_collections.csv"];
    if (productCollections != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "product_collections",
          this.withStoreId(
          this.rows.mapProductCollectionRows(
            this.loader.parseRows(schema.mockStoreProductCollectionRowSchema, productCollections),
            organizationId,
            maps,
          ),
          storeId,
        ),
          "organization_id,product_id,collection_id",
        ),
      );
    }

    return results;
  }

  private async loadCommerceParents(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    storeId: string,
    files: MockStoreFiles,
    maps: IdMapCache,
  ): Promise<ImportTableResult[]> {
    const { schema } = this.rows;
    const results: ImportTableResult[] = [];

    const customers = files["customers.csv"];
    if (customers != null) {
      const result = await this.loader.upsert(
        supabase,
        "customers",
        this.withStoreId(
          this.rows.mapCustomerRows(
          this.loader.parseRows(schema.mockStoreCustomerRowSchema, customers),
          organizationId,
        ),
          storeId,
        ),
        "organization_id,external_id",
      );
      await this.refreshIdMap(supabase, "customers", organizationId, maps);
      results.push(result);
    }

    const discountCodes = files["discount_codes.csv"];
    if (discountCodes != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "discount_codes",
          this.withStoreId(
          this.rows.mapDiscountCodeRows(
            this.loader.parseRows(schema.mockStoreDiscountCodeRowSchema, discountCodes),
            organizationId,
          ),
          storeId,
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
        this.withStoreId(
          this.rows.mapEmailCampaignRows(
          this.loader.parseRows(schema.mockStoreEmailCampaignRowSchema, emailCampaigns),
          organizationId,
        ),
          storeId,
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
        this.withStoreId(
          this.rows.mapPurchaseOrderRows(
          this.loader.parseRows(schema.mockStorePurchaseOrderRowSchema, purchaseOrders),
          organizationId,
        ),
          storeId,
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
          this.withStoreId(
          this.rows.mapBankTransactionRows(
            this.loader.parseRows(schema.mockStoreBankTransactionRowSchema, bankTransactions),
            organizationId,
          ),
          storeId,
        ),
          "organization_id,external_id",
        ),
      );
    }

    return results;
  }

  private async loadCommerceChildren(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    storeId: string,
    files: MockStoreFiles,
    maps: IdMapCache,
  ): Promise<ImportTableResult[]> {
    const { schema } = this.rows;
    const results: ImportTableResult[] = [];

    const orders = files["orders.csv"];
    if (orders != null) {
      const result = await this.loader.upsert(
        supabase,
        "orders",
        this.withStoreId(
          this.rows.mapOrderRows(
          this.loader.parseRows(schema.mockStoreOrderRowSchema, orders),
          organizationId,
          maps,
        ),
          storeId,
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
          this.withStoreId(
          this.rows.mapLineItemRows(
            this.loader.parseRows(schema.mockStoreLineItemRowSchema, lineItems),
            organizationId,
            maps,
          ),
          storeId,
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
          this.withStoreId(
          this.rows.mapRefundRows(
            this.loader.parseRows(schema.mockStoreRefundRowSchema, refunds),
            organizationId,
            maps,
          ),
          storeId,
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
          this.withStoreId(
          this.rows.mapInventoryMovementRows(
            this.loader.parseRows(schema.mockStoreInventoryMovementRowSchema, inventoryMovements),
            organizationId,
            maps,
          ),
          storeId,
        ),
          "organization_id,external_id",
        ),
      );
    }

    const addresses = files["addresses.csv"];
    if (addresses != null) {
      results.push(
        await this.loader.upsert(
          supabase,
          "addresses",
          this.withStoreId(
          this.rows.mapAddressRows(
            this.loader.parseRows(schema.mockStoreAddressRowSchema, addresses),
            organizationId,
            maps,
          ),
          storeId,
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
          this.withStoreId(
          this.rows.mapEmailEventRows(
            this.loader.parseRows(schema.mockStoreEmailEventRowSchema, emailEvents),
            organizationId,
            maps,
          ),
          storeId,
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
        this.withStoreId(
          this.rows.mapSupportTicketRows(
          this.loader.parseRows(schema.mockStoreSupportTicketRowSchema, supportTickets),
          organizationId,
          maps,
        ),
          storeId,
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
          this.withStoreId(
          this.rows.mapSupportMessageRows(
            this.loader.parseJsonRows(schema.mockStoreSupportMessageRowSchema, supportMessages),
            organizationId,
            maps,
          ),
          storeId,
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
          this.withStoreId(
          this.rows.mapPoLineItemRows(
            this.loader.parseRows(schema.mockStorePoLineItemRowSchema, poLineItems),
            organizationId,
            maps,
          ),
          storeId,
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
          this.withStoreId(
          this.rows.mapMetaAdsDailyRows(
            this.loader.parseRows(schema.mockStoreMetaAdsDailyRowSchema, metaAds),
            organizationId,
          ),
          storeId,
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
          this.withStoreId(
          this.rows.mapGoogleAdsDailyRows(
            this.loader.parseRows(schema.mockStoreGoogleAdsDailyRowSchema, googleAds),
            organizationId,
          ),
          storeId,
        ),
          "organization_id,date,campaign_name,ad_group",
        ),
      );
    }

    return results;
  }
}
