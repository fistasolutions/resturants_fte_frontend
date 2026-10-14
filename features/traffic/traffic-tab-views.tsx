"use client";

import HoursLoading from "@/app/(app)/traffic/hours/loading";
import TrafficOverviewLoading from "@/app/(app)/traffic/loading";
import OpportunityLoading from "@/app/(app)/traffic/opportunity/loading";
import StoresLoading from "@/app/(app)/traffic/stores/loading";
import { LostSalesView } from "@/features/traffic/lost-sales-view";
import { PeakHoursView } from "@/features/traffic/peak-hours-view";
import { StoreLeagueView } from "@/features/traffic/store-league-view";
import { StoreTrafficView } from "@/features/traffic/store-traffic-view";
import { TrafficError } from "@/features/traffic/traffic-error";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { trafficQueries } from "@/lib/queries/traffic";

/**
 * The four Store Traffic tabs, read from the client cache (SPEC-230). The chrome
 * (header / picker / tabs) is the persistent `TrafficShell` layout; each tab is only
 * its content. Overview, Lost Sales and Store League share one overview query, so
 * switching between them never fetches twice for the same range.
 */
interface TabProps {
  range: ResolvedRange;
}

export function TrafficOverviewTab({ range }: TabProps) {
  const overview = useApiQuery(trafficQueries.overview(range.from, range.to));
  if (overview.isPending) return <TrafficOverviewLoading />;
  if (overview.isError) return <TrafficError />;
  return <StoreTrafficView data={overview.data} lastSync={overview.data.last_sync ?? null} />;
}

export function PeakHoursTab({ range }: TabProps) {
  const hours = useApiQuery(trafficQueries.peakHours(range.from, range.to));
  if (hours.isPending) return <HoursLoading />;
  if (hours.isError) return <TrafficError />;
  return <PeakHoursView data={hours.data} />;
}

export function LostSalesTab({ range }: TabProps) {
  const overview = useApiQuery(trafficQueries.overview(range.from, range.to));
  if (overview.isPending) return <OpportunityLoading />;
  if (overview.isError) return <TrafficError />;
  return <LostSalesView data={overview.data} />;
}

export function StoreLeagueTab({ range }: TabProps) {
  const overview = useApiQuery(trafficQueries.overview(range.from, range.to));
  if (overview.isPending) return <StoresLoading />;
  if (overview.isError) return <TrafficError />;
  return <StoreLeagueView data={overview.data} />;
}
