import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { NetworkView } from "@/features/restaurant/network-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { readFilters, normalizeNetworkTab, type RestaurantSearchParams } from "@/lib/restaurant";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Network" };
export const dynamic = "force-dynamic";

/** Content only — the header, tabs and period live in the persistent shell (SPEC-232). The active
 * tab's reads start here and stream into the client cache (SPEC-230). */
export default async function NetworkPage({ searchParams }: { searchParams: Promise<RestaurantSearchParams> }) {
  const params = await searchParams;
  const filters = readFilters(params, dateToISO(new Date()));
  const tab = normalizeNetworkTab(params.tab);
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.setup());
  if (tab === "overview") prefetch(queryClient, restaurantQueries.overview(filters));
  else if (tab === "branches") prefetch(queryClient, restaurantQueries.league(filters));
  else if (tab === "franchisees") prefetch(queryClient, restaurantQueries.franchisees());
  else if (tab === "regions") prefetch(queryClient, restaurantQueries.regions());
  else if (tab === "settings") prefetch(queryClient, restaurantQueries.settings());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NetworkView tab={tab} filters={filters} />
    </HydrationBoundary>
  );
}
