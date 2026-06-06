"use client";

import { useState } from "react";

import { ShopifyIcon } from "@/components/auth/provider-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shopifyShopInputSchema } from "@/lib/shopify";

export default function ShopifyLoginButton() {
  const [shop, setShop] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startShopifyLogin() {
    const trimmed = shop.trim();
    if (!trimmed) {
      setError("Enter your Shopify store handle");
      return;
    }

    const parsed = shopifyShopInputSchema.safeParse(trimmed);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid Shopify store handle");
      return;
    }

    setError(null);
    const params = new URLSearchParams({
      shop: parsed.data,
      intent: "login",
    });
    window.location.assign(`/api/shopify/auth?${params.toString()}`);
  }

  return (
    <form
      className="w-full max-w-sm space-y-3 pb-6"
      onSubmit={(event) => {
        event.preventDefault();
        startShopifyLogin();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="shopify-login-shop" className="text-sm text-muted-foreground">
          Shopify store
        </Label>
        <Input
          id="shopify-login-shop"
          name="shop"
          placeholder="your-store"
          autoComplete="off"
          spellCheck={false}
          value={shop}
          onChange={(event) => {
            setShop(event.target.value);
            if (error) {
              setError(null);
            }
          }}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="w-full gap-2 border-[#95BF47]/50 hover:bg-[#95BF47]/10"
      >
        <ShopifyIcon />
        Continue with Shopify
      </Button>
      {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
