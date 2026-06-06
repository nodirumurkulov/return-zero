"use client";

import { useRouter } from "next/navigation";

import { ShopifyIcon } from "@/components/auth/provider-icons";
import { HugoMark } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { useImportStore } from "@/hooks/stores/import";
import { HUGO_MOCK_STORE_NAME } from "@/lib/tenancy";

import StorePlatformCard from "./StorePlatformCard";

type StoreConnectFormProps = {
  storeReady?: boolean;
};

export default function StoreConnectForm({ storeReady = false }: StoreConnectFormProps) {
  const router = useRouter();
  const importStore = useImportStore("mock_csv");

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

  const actionLabel = pending ? "Connecting mock store…" : "Connect mock store";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:max-w-none sm:grid-cols-2">
        <StorePlatformCard
          testId="store-option-shopify"
          icon={<ShopifyIcon />}
          title="Shopify"
          description="Connect your live Shopify store for real-time catalog, orders, and support data."
          disabled
          comingSoon
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
