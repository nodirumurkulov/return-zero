import { SlackIcon, ShopifyIcon } from "@/components/marketing/icons";
import { SectionLabel } from "@/components/ui/section-label";

export function IntegrationsStrip() {
  return (
    <section className="border-b border-border py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 sm:px-6">
        <SectionLabel>Integrations</SectionLabel>
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <SlackIcon className="size-5" />
            <span>Slack</span>
          </div>
          <div className="flex items-center gap-2">
            <ShopifyIcon className="size-5" />
            <span>
              Shopify <span className="text-xs">(coming soon)</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
