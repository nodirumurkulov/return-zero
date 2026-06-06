"use client";

import { useState } from "react";
import { ShopifyIcon } from "@/components/auth/provider-icons";
import { Button } from "@/components/ui/button";

const NOTICE_ID = "shopify-login-notice";

export default function ShopifyLoginButton() {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="w-full max-w-sm space-y-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2 border-[#95BF47]/50 hover:bg-[#95BF47]/10"
        aria-describedby={showNotice ? NOTICE_ID : undefined}
        onClick={() => {
          setShowNotice(true);
        }}
      >
        <ShopifyIcon />
        Continue with Shopify
      </Button>
      {showNotice ? (
        <p id={NOTICE_ID} role="status" className="text-center text-xs text-muted-foreground">
          Shopify login is coming soon.
        </p>
      ) : null}
    </div>
  );
}
