import { Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BundlesData } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

/**
 * Products → Bundles (SPEC-191). Pairs ranked by the margin already flowing
 * through them, not by how often they happen to co-occur.
 *
 * Every upsell app on the Shopify store ranks by frequency. Per-product COGS is
 * what this platform has that they do not — and on production the top pair by
 * margin is worth materially more than the top pair by frequency.
 *
 * Nothing here forecasts what a bundle "would" earn: that needs the
 * counterfactual, which the data does not contain.
 */
export function BundlesView({ data }: { data: BundlesData }) {
  const { summary, bundles } = data;

  if (bundles.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">No bundle candidates yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pairs need cost data on both products to be ranked by margin.
        </p>
      </Card>
    );
  }

  const marginBeatsFrequency =
    summary.topPairByMargin !== null &&
    summary.topPairByFrequencyMargin !== null &&
    summary.topPairByMargin > summary.topPairByFrequencyMargin;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Pairs ranked
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.pairsRanked)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            of {formatNumber(summary.pairsConsidered)} considered
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Margin flowing
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-success">
            {formatCurrency(summary.marginFlowingTop)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">through the pairs below</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Top pair by margin
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {summary.topPairByMargin === null
              ? "—"
              : formatCurrency(summary.topPairByMargin)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Top pair by frequency
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-muted-foreground">
            {summary.topPairByFrequencyMargin === null
              ? "—"
              : formatCurrency(summary.topPairByFrequencyMargin)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">what an upsell app picks</p>
        </Card>
      </div>

      {marginBeatsFrequency && (
        <Card className="border-l-4 border-l-success p-4">
          <p className="text-sm text-foreground">
            Ranking by margin picks a bundle worth{" "}
            <span className="font-semibold">
              {formatCurrency(
                (summary.topPairByMargin ?? 0) - (summary.topPairByFrequencyMargin ?? 0),
              )}
            </span>{" "}
            more than ranking by how often a pair happens to sell together.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {bundles.map((bundle) => (
          <Card
            key={`${bundle.productA}-${bundle.productB}`}
            className="flex flex-wrap items-center justify-between gap-4 p-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {bundle.titleA}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatCurrency(bundle.marginA)} margin
                </p>
              </div>
              <Plus className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {bundle.titleB}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatCurrency(bundle.marginB)} margin
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-5 text-right">
              <div>
                <p className="text-[11px] text-muted-foreground">Bought together</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatNumber(bundle.ordersTogether)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Attach rate</p>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    (bundle.attachRatePct ?? 0) >= 50
                      ? "text-success"
                      : "text-muted-foreground",
                  )}
                >
                  {bundle.attachRatePct === null ? "—" : `${bundle.attachRatePct}%`}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Margin / bundle</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(bundle.marginPerBundle)}
                </p>
              </div>
              <div className="w-24">
                <p className="text-[11px] text-muted-foreground">Margin flowing</p>
                <p className="text-base font-bold tabular-nums text-success">
                  {formatCurrency(bundle.marginFlowing)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Attach rate is measured against the rarer of the two products — a pair that sells
        together 50 times where one product sells 10,000 times is a coincidence, not a
        bundle. {formatNumber(summary.pairsWithoutCost)} pairs are excluded for missing
        cost data. Every figure is margin that already moved; nothing here forecasts what
        a bundle would earn.
      </p>
    </div>
  );
}
