import { SlackIcon, ShopifyIcon } from "@/components/marketing/icons";

export function IntegrationsStrip() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          Works where your team already lives
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlackIcon className="size-6" />
            <span>Slack</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShopifyIcon className="size-6" />
            <span>
              Shopify <span className="text-xs">(coming soon)</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
