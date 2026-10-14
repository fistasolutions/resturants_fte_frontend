"use client";

import InventoryLoading from "@/app/(app)/inventory/loading";
import { Card } from "@/components/ui/card";
import { AiCommentary } from "@/features/analysis/ai-commentary";
import { AiCommentarySkeleton } from "@/features/analysis/ai-commentary-skeleton";
import { InventorySnapshotTiles } from "@/features/analysis/inventory-snapshot-tiles";
import { InventoryVerdictTiles } from "@/features/analysis/inventory-verdict-tiles";
import { ReorderTable } from "@/features/analysis/reorder-table";
import { SectionCard } from "@/features/analysis/section-card";
import { SimpleTable } from "@/features/analysis/simple-table";
import { TransferPlan } from "@/features/analysis/transfer-plan";
import { TransferTable } from "@/features/analysis/transfer-table";
import { LocationValueChart } from "@/features/inventory/location-value-chart";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import type { InventoryTabKey } from "@/lib/inventory-tabs";
import { analysisApiQuery, analysisQueries } from "@/lib/queries/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

// Dead Stock + By Location have their own dedicated pages/fetches — this shared
// body serves only the four range tabs that read the analysis/transfers slices.
export type SharedInventoryTab = Exclude<InventoryTabKey, "dead-stock" | "by-location">;

interface InventoryTabContentProps {
  tab: SharedInventoryTab;
  range: ResolvedRange;
}

/**
 * Shared body for the range Inventory Analyst tabs (SPEC-083; SPEC-100 split), read
 * from the client cache (SPEC-230). Each tab observes ONLY the slice it renders —
 * the analysis tabs (overview / reorder / overstock-movers) share one `/inventory`
 * answer so switching between them never refetches it; the transfers tab reads
 * transfers + transfer-plan and never pays for the analysis blob. The LLM-backed
 * commentary keeps its own skeleton so the fast data never waits on it.
 */
export function InventoryTabContent({ tab, range }: InventoryTabContentProps) {
  const q = { from: range.from, to: range.to };
  const isTransfers = tab === "transfers";
  const isOverview = tab === "overview";

  const analysis = useApiQuery(isTransfers ? null : analysisQueries.inventory(q));
  const transfersQuery = useApiQuery(isTransfers ? analysisQueries.inventoryTransfers(q, 1) : null);
  const plan = useApiQuery(isTransfers ? analysisQueries.transferPlan(q) : null);
  const byLocationQuery = useApiQuery(isOverview ? analysisQueries.inventoryByLocation() : null);
  const commentary = useApiQuery(isOverview ? analysisQueries.inventoryCommentary(q) : null);
  const velocityBasis = `at the selected period's sales pace (${range.label})`;

  if (isTransfers) {
    if (transfersQuery.isPending || plan.isPending) return <InventoryLoading />;
  } else if (analysis.isPending || (isOverview && byLocationQuery.isPending)) {
    return <InventoryLoading />;
  }

  // Every loader here resolves null on failure (never throws), exactly as the
  // server page's did — so "unavailable" is a null answer, not an error state.
  const data = analysis.data ?? null;
  const transfers = transfersQuery.data ?? null;
  const transferPlan = plan.data ?? null;
  const byLocation = byLocationQuery.data ?? null;

  if (!isTransfers && !data) {
    return (
      <Card className="px-6 py-8 text-center">
        <p className="text-sm font-medium text-foreground">
          Inventory data is temporarily unavailable.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The analytics engine encountered an error. Try refreshing the page or selecting a
          different date range.
        </p>
      </Card>
    );
  }

  return (
    <>
      {tab === "overview" && data && (
        <>
          <InventoryVerdictTiles verdicts={data.verdicts} />
          <InventorySnapshotTiles analysis={data} byLocation={byLocation} />
          {commentary.isPending ? (
            <AiCommentarySkeleton />
          ) : (
            <AiCommentary
              page="inventory"
              query={analysisApiQuery(range)}
              initialCommentary={commentary.data ?? null}
            />
          )}
          {byLocation && <LocationValueChart locations={byLocation.locations} />}
        </>
      )}

      {tab === "reorder" && data && (
        <>
          <ReorderTable alerts={data.reorder_alerts} query={analysisApiQuery(range)} />
          <SectionCard
            title="⛔ Selling but out of stock"
            headline="demand you're currently missing"
          >
            <SimpleTable
              headers={["Product", "Sold", "Period revenue", "Stock"]}
              rows={data.out_of_stock_sellers.map((p) => [
                p.title,
                formatNumber(p.units),
                formatCurrency(p.window_revenue),
                formatNumber(p.stock),
              ])}
              emptyMessage="No sellers are out of stock. Good."
            />
          </SectionCard>
        </>
      )}

      {tab === "overstock-movers" && data && (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SectionCard title="📦 Overstock" estimate={`over 90 days of cover ${velocityBasis}`}>
            <SimpleTable
              headers={["Product", "Sold", "Stock", "Value", "Cover"]}
              rows={data.overstock.map((p) => [
                p.title,
                formatNumber(p.units),
                formatNumber(p.stock),
                formatCurrency(p.stock_value),
                `${formatNumber(Math.round(p.days_of_cover))}d`,
              ])}
              emptyMessage="No sellers hold more than 90 days of stock."
            />
          </SectionCard>

          <SectionCard title="Fast movers">
            <SimpleTable
              headers={["Product", "Units", "Revenue", "Stock"]}
              rows={data.fast_movers.map((p) => [
                p.title,
                formatNumber(p.units),
                formatCurrency(p.revenue),
                formatNumber(p.stock),
              ])}
              emptyMessage="No sales in this period."
            />
          </SectionCard>

          <SectionCard title="Slow movers" headline="stocked but barely selling">
            <SimpleTable
              headers={["Product", "Units", "Revenue", "Stock"]}
              rows={data.slow_movers.map((p) => [
                p.title,
                formatNumber(p.units),
                formatCurrency(p.revenue),
                formatNumber(p.stock),
              ])}
              emptyMessage="No stocked slow movers in this period."
            />
          </SectionCard>
        </section>
      )}

      {tab === "transfers" && (
        <>
          {transferPlan && <TransferPlan plan={transferPlan} />}
          <TransferTable
            key={analysisApiQuery(range)}
            initialData={transfers}
            query={analysisApiQuery(range)}
          />
        </>
      )}
    </>
  );
}
