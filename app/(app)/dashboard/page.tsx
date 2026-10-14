import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DashboardView } from "@/features/dashboard/dashboard-view";
import { resolveCompareMode, resolveDateRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { storeQueries } from "@/lib/queries/store";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { getWorkspace } from "@/services/workspace";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    date?: string;
    compare?: string;
  }>;
}

/**
 * Parses the URL, starts the fetches, renders — without waiting (SPEC-230).
 *
 * The six prefetches are not awaited: their pending promises are dehydrated into the
 * RSC payload and streamed to the browser, where `DashboardView` observes them from the
 * session cache. First visit shows the skeleton until they land; every revisit paints
 * the cached dashboard at once and lets these refresh it in place.
 */
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const todayISO = new Date().toISOString().slice(0, 10);
  const range = resolveDateRange(params, todayISO);
  // SPEC-318: the layout's cached workspace read — no added round trip.
  const { calendarSystem } = await getWorkspace();
  const compare = resolveCompareMode(params.compare, calendarSystem);

  const queryClient = getQueryClient();
  prefetch(
    queryClient,
    dashboardQueries.data({ from: range.from, to: range.to, compare, label: range.label }),
  );
  prefetch(queryClient, dashboardQueries.locations(range.from, range.to));
  prefetch(queryClient, storeQueries.currentUser());
  prefetch(queryClient, storeQueries.connection());
  prefetch(queryClient, analysisQueries.deadInventoryAlerts());
  prefetch(queryClient, dashboardQueries.money());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView range={range} compare={compare} />
    </HydrationBoundary>
  );
}
