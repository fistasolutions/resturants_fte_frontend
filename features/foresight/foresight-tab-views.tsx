"use client";

import ForecastLoading from "@/app/(app)/foresight/forecast/loading";
import ProfitLoading from "@/app/(app)/foresight/loading";
import SizesLoading from "@/app/(app)/foresight/sizes/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { ForecastView } from "@/features/foresight/forecast-view";
import { LaunchWatchView } from "@/features/foresight/launch-watch-view";
import { ProfitLensView } from "@/features/foresight/profit-lens-view";
import { SeasonView } from "@/features/foresight/season-view";
import { SizeIntelligenceView } from "@/features/foresight/size-intelligence-view";
import { StockoutView } from "@/features/foresight/stockout-view";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { foresightQueries } from "@/lib/queries/foresight";

/**
 * The Foresight tabs, read from the client cache (SPEC-230). The chrome (header /
 * picker / tabs) is the persistent foresight shell; each tab is only its content
 * and keeps the exact error copy its server page had.
 */

function TabError({ what }: { what: string }) {
  return (
    <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
      Couldn&apos;t load {what} right now. Try again shortly.
    </div>
  );
}

function TabSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </>
  );
}

export function ProfitLensTab({ range }: { range: ResolvedRange }) {
  const lens = useApiQuery(foresightQueries.profit({ from: range.from, to: range.to }));
  if (lens.isPending) return <ProfitLoading />;
  if (lens.isError) return <TabError what="Profit Lens" />;
  return <ProfitLensView data={lens.data} />;
}

export function ForecastTab() {
  const forecast = useApiQuery(foresightQueries.forecast());
  if (forecast.isPending) return <ForecastLoading />;
  if (forecast.isError) return <TabError what="the forecast" />;
  return <ForecastView data={forecast.data} />;
}

export function SizeIntelligenceTab({ range }: { range: ResolvedRange }) {
  const sizes = useApiQuery(foresightQueries.sizes({ from: range.from, to: range.to }));
  if (sizes.isPending) return <SizesLoading />;
  if (sizes.isError) return <TabError what="Size Intelligence" />;
  return <SizeIntelligenceView data={sizes.data} />;
}

export function SeasonTab() {
  const radar = useApiQuery(foresightQueries.season());
  const accuracy = useApiQuery(foresightQueries.seasonAccuracy());
  if (radar.isPending || accuracy.isPending) return <TabSkeleton />;
  if (radar.isError || accuracy.isError) return <TabError what="Season Radar" />;
  return <SeasonView radar={radar.data} accuracy={accuracy.data} />;
}

export function StockoutTab() {
  const board = useApiQuery(foresightQueries.stockout());
  const accuracy = useApiQuery(foresightQueries.stockoutAccuracy());
  if (board.isPending || accuracy.isPending) return <TabSkeleton />;
  if (board.isError || accuracy.isError) return <TabError what="Stockout Risk" />;
  return <StockoutView board={board.data} accuracy={accuracy.data} />;
}

export function LaunchWatchTab({ watchDays }: { watchDays: number }) {
  const watch = useApiQuery(foresightQueries.launchWatch(watchDays));
  if (watch.isPending) return <TabSkeleton />;
  if (watch.isError) return <TabError what="Launch Watch" />;
  return <LaunchWatchView data={watch.data} />;
}
