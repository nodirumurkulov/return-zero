import Link from "next/link";
import { RunAnalysis } from "@/components/onboarding/RunAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sparkline from "@/components/ui/sparkline";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { parseReportSummary } from "@/lib/stores/analytics/learn/schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const gbp = (n: number) =>
  `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function ReportPage() {
  const supabase = await createClient();
  const org = await tryRequireOrganizationId(supabase);
  if (!org.ok) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-muted-foreground">{org.error}</p>
      </div>
    );
  }

  const { data } = await supabase
    .from("business_reports")
    .select("summary, narrative, created_at")
    .eq("organization_id", org.organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Your business report</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll analyze your store data, learn what&apos;s normal, and surface the patterns worth
          watching. This takes a few seconds.
        </p>
        <div className="mt-6">
          <RunAnalysis label="Analyze my data" />
        </div>
      </div>
    );
  }

  const summary = parseReportSummary(data.summary);
  if (!summary) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Your business report</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The stored report could not be read. Re-run analysis to regenerate it.
        </p>
        <div className="mt-6">
          <RunAnalysis label="Re-run analysis" />
        </div>
      </div>
    );
  }

  const t = summary.totals;
  const trendLabel =
    summary.trend.revenue_direction === "rising"
      ? "Revenue trending up"
      : summary.trend.revenue_direction === "falling"
        ? "Revenue trending down"
        : "Revenue holding steady";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Your business report</p>
        <h1 className="text-3xl font-semibold tracking-tight">What your data shows</h1>
        <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {data.narrative}
        </p>
      </header>

      {/* Headline stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Revenue" value={gbp(t.revenue_lifetime)} hint={`${summary.trend.months.length} mo`} />
        <Stat label="Orders" value={t.orders.toLocaleString()} />
        <Stat label="AOV" value={gbp(t.aov)} />
        <Stat label="Refund rate" value={pct(t.refund_rate)} />
        <Stat label="Return rate" value={pct(t.return_rate)} />
        <Stat label="Products" value={`${t.products}`} hint={`${t.skus} SKUs`} />
      </section>

      {/* Trends */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{trendLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline data={summary.trend.revenue} className="h-16 w-full" />
            {summary.trend.peak_revenue_month && (
              <p className="mt-2 text-xs text-muted-foreground">
                Peak month: {summary.trend.peak_revenue_month}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Refund rate over time</CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline
              data={summary.trend.refund_rate}
              className="h-16 w-full"
              stroke="hsl(var(--destructive))"
            />
          </CardContent>
        </Card>
      </section>

      {/* Patterns we noticed */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top products by revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {summary.top.by_revenue.map((p) => (
              <div key={p.product_id} className="flex justify-between gap-2">
                <span className="truncate">{p.title}</span>
                <span className="text-muted-foreground">{gbp(p.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Highest refund rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {summary.top.worst_refund_rate.map((p) => (
              <div key={p.product_id} className="flex justify-between gap-2">
                <span className="truncate">{p.title}</span>
                <span className="text-destructive">{pct(p.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lowest ad ROAS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {summary.top.worst_roas.map((p) => (
              <div key={p.product_id} className="flex justify-between gap-2">
                <span className="truncate">{p.title}</span>
                <span className="text-muted-foreground">{p.value.toFixed(2)}x</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* What we'll watch (the learned knowledge base) */}
      {summary.learned.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>What we&apos;ll watch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {summary.learned.map((l) => (
                <p key={l.metric_key} className="text-muted-foreground">
                  We learned your normal <span className="text-foreground">{l.display_name}</span> is
                  about {l.metric_key === "ad_roas" ? `${l.avg_mean.toFixed(2)}x` : pct(l.avg_mean)} across{" "}
                  {l.products} products. We&apos;ll alert{" "}
                  {l.metric_key === "ad_roas" ? "below" : "above"}{" "}
                  {l.metric_key === "ad_roas" ? `${l.avg_threshold.toFixed(2)}x` : pct(l.avg_threshold)}.
                </p>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Risks now */}
      {summary.risks_now.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Outside the band right now ({summary.risks_now.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {summary.risks_now.map((r) => (
                <div key={`${r.product_id}:${r.metric_key}`} className="flex justify-between gap-2">
                  <span className="truncate">
                    {r.title}: {r.display_name}
                  </span>
                  <span className="text-destructive">
                    {r.value == null ? "N/A" : r.metric_key === "ad_roas" ? r.value.toFixed(2) : pct(r.value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      <footer className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/incidents"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go to incidents
        </Link>
        <Link
          href="/catalog"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Explore catalog
        </Link>
        <RunAnalysis label="Re-run analysis" />
      </footer>
    </div>
  );
}
