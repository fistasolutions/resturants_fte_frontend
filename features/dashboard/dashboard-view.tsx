"use client";

import { ErrorState } from "@/components/shared/error-state";
import { KpiStrip } from "@/components/shared/kpi-strip";
import { AlertStrip } from "@/features/dashboard/alert-strip";
import { CalendarNoteLine } from "@/features/dashboard/calendar-note";
import { ChannelBars } from "@/features/dashboard/channel-bars";
import { DashboardSkeleton } from "@/features/dashboard/dashboard-skeleton";
import { LocationTable } from "@/features/dashboard/location-table";
import { MoneyStrip } from "@/features/dashboard/money-strip";
import { NetSalesWaterfall } from "@/features/dashboard/net-sales-waterfall";
import { RecentOrders } from "@/features/dashboard/recent-orders";
import { RevenueChart } from "@/features/dashboard/revenue-chart";
import { TopProducts } from "@/features/dashboard/top-products";
import { WhatChangedCard } from "@/features/dashboard/what-changed-card";
import { useApiQuery } from "@/hooks/use-api-query";
import { compareHref } from "@/lib/calendar-note";
import { buildDashboardAlerts } from "@/lib/dashboard-alerts";
import { buildDashboardStrip } from "@/lib/dashboard-strip";
import type { CompareMode, ResolvedRange } from "@/lib/date-range";
import { classifyError } from "@/lib/error-boundary";
import { analysisQueries } from "@/lib/queries/analysis";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { storeQueries } from "@/lib/queries/store";
import { LIVE_QUERY_OPTIONS } from "@/lib/query-client";
import { useWorkspace } from "@/features/workspace/workspace-provider";

interface DashboardViewProps {
  range: ResolvedRange;
  compare: CompareMode;
}

/**
 * The Dashboard, read from the client cache (SPEC-230), laid out as three strips over
 * two columns (SPEC-233, SPEC-237): money at stake, KPIs and alerts across the top; the chart, the locations
 * table and recent orders on the left; net sales, what changed, channels and top
 * products on the right.
 *
 * The page prefetches the same five queries on the server and streams them in; this
 * component only observes the cache. The numbers-bearing queries carry
 * `LIVE_QUERY_OPTIONS` — refetch every minute while visible, pause when hidden, catch
 * up on focus — which is SPEC-021's auto-refresh contract without re-rendering the
 * whole server page each minute. Locations and misplaced-stock degrade on their own;
 * only the aggregate, the user or the store failing shows the error panel.
 */
/** The revenue chart's second line, named for what it is. */
const PREVIOUS_LABEL: Record<CompareMode, string> = {
  previous_period: "Previous period",
  previous_year: "Same dates last year",
  hebrew_year: "Same Hebrew dates last year",
  none: "Previous period",
};

export function DashboardView({ range, compare }: DashboardViewProps) {
  // SPEC-318: the festival line and its Hebrew switch belong to Hebrew-calendar organizations.
  const { calendarSystem } = useWorkspace();
  const data = useApiQuery(
    dashboardQueries.data({ from: range.from, to: range.to, compare, label: range.label }),
    LIVE_QUERY_OPTIONS,
  );
  const locations = useApiQuery(
    dashboardQueries.locations(range.from, range.to),
    LIVE_QUERY_OPTIONS,
  );
  const deadInventory = useApiQuery(analysisQueries.deadInventoryAlerts(), LIVE_QUERY_OPTIONS);
  const store = useApiQuery(storeQueries.connection(), LIVE_QUERY_OPTIONS);
  const user = useApiQuery(storeQueries.currentUser());

  if (data.isPending || user.isPending || store.isPending) {
    return <DashboardSkeleton />;
  }

  if (data.isError || user.isError || store.isError) {
    const failure = data.error ?? user.error ?? store.error ?? undefined;
    return (
      <div>
        <div>
          <ErrorState
            presentation={classifyError(failure)}
            onRetry={() => {
              void data.refetch();
              void user.refetch();
              void store.refetch();
            }}
          />
        </div>
      </div>
    );
  }

  const dashboard = data.data;
  const locationData = locations.data ?? null;
  const misplaced = deadInventory.data ?? null;
  const tiles = buildDashboardStrip(
    dashboard.kpis,
    dashboard.netSales,
    dashboard.comparisonShortLabel,
  );
  const alerts = buildDashboardAlerts(dashboard.alerts, misplaced);

  return (
    <div className="space-y-4">
      {/* Money at stake — three sums above everything else (SPEC-237): fixed windows,
          not the date picker's. */}
      <MoneyStrip />

      {/* KPI strip — the five KPIs with Net sales after Revenue (SPEC-233; the
          waterfall's headline number, SPEC-184). Orders and New customers stay links. */}
      <KpiStrip tiles={tiles} label="Key performance indicators" />

      {/* Inventory & returns alerts — five tiles in one row; misplaced stock degrades
          on its own when its query fails (SPEC-230). */}
      {/* Which festivals the range and the compared window held (SPEC-307). */}
      <CalendarNoteLine
        note={calendarSystem === "hebrew" ? dashboard.calendarNote : null}
        hebrewHref={compareHref(
          "/dashboard",
          new URLSearchParams(range.preset ? { range: range.preset } : { from: range.from, to: range.to }),
          "hebrew_year",
        )}
      />

      <AlertStrip alerts={alerts} />

      {/* Both columns stretch to the taller one (SPEC-287): the main column is a flex
          column whose last panel, Recent orders, fills the height the rail leaves. */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-8">
        {/* Main column: the chart, the locations, the orders */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
          <RevenueChart
            data={dashboard.revenueSeries}
            currentLabel={dashboard.periodLabel}
            previousLabel={PREVIOUS_LABEL[compare]}
            showPrevious={dashboard.showComparison}
          />

          {/* Location Intelligence — one table, quiet locations on one line */}
          {locationData && locationData.locations.length > 0 && (
            <LocationTable data={locationData} />
          )}

          <RecentOrders orders={dashboard.recentOrders} />
        </div>

        {/* Rail: the breakdowns */}
        <div className="min-w-0 space-y-4 lg:col-span-3">
          {/* Net sales waterfall — per client request (SPEC-184); omitted when the
              backend does not serve it. */}
          {dashboard.netSales && <NetSalesWaterfall data={dashboard.netSales} />}

          {/* What changed, and why — the cause behind the KPI move (SPEC-190). */}
          {dashboard.whatChanged && <WhatChangedCard data={dashboard.whatChanged} />}

          <ChannelBars channels={dashboard.channels} />

          <TopProducts products={dashboard.topProducts} />
        </div>
      </div>
    </div>
  );
}
