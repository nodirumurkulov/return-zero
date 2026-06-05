"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ComingSoonLoginButton({
  provider,
  icon,
}: {
  provider: string;
  icon: React.ReactNode;
}) {
  const [showNotice, setShowNotice] = useState(false);
  const noticeId = `${provider.toLowerCase()}-notice`;

  return (
    <div className="w-full max-w-sm space-y-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2"
        aria-describedby={showNotice ? noticeId : undefined}
        onClick={() => {
          setShowNotice(true);
        }}
      >
        {icon}
        Continue with {provider}
      </Button>
      {showNotice ? (
        <p id={noticeId} role="status" className="text-center text-xs text-muted-foreground">
          {provider} login is coming soon.
        </p>
      ) : null}
    </div>
  );
}
