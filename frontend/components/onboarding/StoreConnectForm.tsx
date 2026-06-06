"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ShopifyIcon } from "@/components/auth/provider-icons";
import { HugoMark } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImportStore } from "@/hooks/stores/import";
import { shopifyShopInputSchema } from "@/lib/shopify";
import { HUGO_MOCK_STORE_NAME } from "@/lib/tenancy";

import StorePlatformCard from "./StorePlatformCard";

type StoreConnectFormProps = {
  storeReady?: boolean;
};

export default function StoreConnectForm({ storeReady = false }: StoreConnectFormProps) {
  const router = useRouter();
  const importStore = useImportStore("mock_csv");
  const [shopifyShop, setShopifyShop] = useState("");
  const [shopifyError, setShopifyError] = useState<string | null>(null);

  const pending = importStore.isPending;
  const error = importStore.error instanceof Error ? importStore.error.message : null;

  function goToCatalog() {
    router.push("/catalog");
  }

  function connectStore() {
    importStore.mutate(undefined, {
      onSuccess: () => {
        goToCatalog();
      },
    });
  }

  function connectShopify() {
    const parsed = shopifyShopInputSchema.safeParse(shopifyShop.trim());
    if (!parsed.success) {
      setShopifyError(parsed.error.issues[0]?.message ?? "Enter a valid Shopify store handle");
      return;
    }

    setShopifyError(null);
    const params = new URLSearchParams({
      shop: parsed.data,
      intent: "connect",
      returnTo: "/onboarding",
    });
    window.location.assign(`/api/shopify/auth?${params.toString()}`);
  }

  const actionLabel = pending ? "Connecting mock store…" : "Connect mock store";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:max-w-none sm:grid-cols-2">
        <StorePlatformCard
          testId="store-option-shopify"
          icon={<ShopifyIcon />}
          title="Shopify"
          description="Connect your live Shopify store for real-time catalog, orders, and support data."
          actionLabel="Connect Shopify"
          extra={
            <div className="space-y-2 text-left">
              <Label htmlFor="shopify-connect-shop" className="text-xs text-muted-foreground">
                Store handle
              </Label>
              <Input
                id="shopify-connect-shop"
                name="shop"
                placeholder="your-store"
                autoComplete="off"
                spellCheck={false}
                value={shopifyShop}
                onChange={(event) => {
                  setShopifyShop(event.target.value);
                  if (shopifyError) {
                    setShopifyError(null);
                  }
                }}
              />
              {shopifyError ? (
                <p className="text-xs text-destructive">{shopifyError}</p>
              ) : null}
            </div>
          }
          onAction={connectShopify}
        />
        <StorePlatformCard
          testId="store-option-mock_csv"
          icon={<HugoMark size={24} className="shadow-none" />}
          title={HUGO_MOCK_STORE_NAME}
          description="Load the Hugo mock dataset to explore commerce incident response with realistic ecommerce data."
          connected={storeReady}
          actionLabel={storeReady ? undefined : actionLabel}
          pending={pending}
          onAction={storeReady ? undefined : connectStore}
        />
      </div>

      {storeReady ? (
        <Button onClick={() => goToCatalog()} disabled={pending} className="w-fit">
          Continue to catalog
        </Button>
      ) : null}

      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
