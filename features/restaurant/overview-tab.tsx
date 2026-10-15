"use client";

import { KpiStrip } from "@/components/shared/kpi-strip";
import { Panel, PanelRow } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { NetSalesChart } from "@/features/restaurant/net-sales-chart";
import { EmptyPanel, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { money, overviewTiles, periodLabel } from "@/lib/restaurant";
import type { RankedBranch, RestaurantFilters } from "@/types/restaurant";

function BranchList({ title, rows }: { title: string; rows: RankedBranch[] }) {
  return (
    <Panel title={title} count={rows.length ? String(rows.length) : undefined}>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Not enough branches to compare.</p>
      ) : (
        rows.map((row) => (
          <PanelRow key={row.branchId} href={`/network/branches/${row.branchId}`} align="center" trailing={<span className="text-sm font-semibold tabular-nums">{money(row.netSales)}</span>}>
            <p className="truncate text-sm font-medium text-foreground">
              <span className="tabular-nums text-muted-foreground">#{row.code}</span> {row.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.franchiseeName}</p>
          </PanelRow>
        ))
      )}
    </Panel>
  );
}

/** Network › Overview (SPEC-377): the period's KPIs against the one before, the trend, and the
 * branches at either end of the league. */
export function OverviewTab({ filters }: { filters: RestaurantFilters }) {
  const query = useApiQuery(restaurantQueries.overview(filters));
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={10} />;
  const data = query.data;
  if (data.branches === 0) {
    return (
      <EmptyPanel
        title="No branches yet"
        body="Add your branches on the Branches tab, or import them all at once from a spreadsheet. Their figures appear here as soon as your POS data arrives."
      />
    );
  }
  const compare = `vs ${periodLabel(data.previousPeriod.from, data.previousPeriod.to)}`;
  return (
    <div className="space-y-4">
      <KpiStrip tiles={overviewTiles(data, compare)} label="The network at a glance" explain={false} />
      <NetSalesChart points={data.trend} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BranchList title="Top branches" rows={data.top} />
        <BranchList title="Need attention" rows={data.bottom} />
      </div>
    </div>
  );
}
