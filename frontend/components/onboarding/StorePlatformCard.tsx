"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StorePlatformCardProps = {
  testId: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  comingSoon?: boolean;
  connected?: boolean;
  actionLabel?: string;
  pending?: boolean;
  onAction?: () => void;
};

export default function StorePlatformCard({
  testId,
  icon,
  title,
  description,
  disabled = false,
  comingSoon = false,
  connected = false,
  actionLabel,
  pending = false,
  onAction,
}: StorePlatformCardProps) {
  const [showNotice, setShowNotice] = useState(false);
  const noticeId = `${testId}-notice`;
  const isInteractive = !disabled && !connected && onAction != null;

  function handleCardClick() {
    if (comingSoon && disabled) {
      setShowNotice(true);
    }
  }

  return (
    <Card
      data-testid={testId}
      className={cn(
        "flex h-full flex-col gap-0 overflow-hidden p-0 py-0 shadow-card",
        disabled && "cursor-not-allowed opacity-60",
        connected && "border-sev-resolvedBd bg-sev-resolvedBg/30",
        isInteractive && "hover:border-primary/40 hover:shadow-pop",
      )}
      onClick={comingSoon && disabled ? handleCardClick : undefined}
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40",
              connected && "border-sev-resolvedBd bg-background",
            )}
          >
            <span className="[&_svg]:size-6">{icon}</span>
          </div>
          {connected ? (
            <Badge variant="secondary" className="gap-1">
              <Check className="size-3" aria-hidden />
              Connected
            </Badge>
          ) : comingSoon ? (
            <Badge variant="outline" className="text-muted-foreground">
              Coming soon
            </Badge>
          ) : null}
        </div>

        <div className="space-y-1.5 text-left">
          <h3 className="text-base font-medium leading-snug text-foreground">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        {showNotice ? (
          <p id={noticeId} role="status" className="text-left text-xs text-muted-foreground">
            {title} integration is coming soon.
          </p>
        ) : null}
      </div>

      {isInteractive && actionLabel ? (
        <div className="border-t border-border/60 bg-muted/20 p-5 pt-4">
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            aria-busy={pending}
            onClick={() => {
              onAction();
            }}
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
