import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { OperationsView } from "@/features/restaurant/operations-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { readFilters, normalizeOperationsTab, type RestaurantSearchParams } from "@/lib/restaurant";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Operations" };
export const dynamic = "force-dynamic";

/** Content only — the header and the period live in the persistent shell (SPEC-232); the read
 * starts here and streams into the client cache (SPEC-230). */
export default async function Page({ searchParams }: { searchParams: Promise<RestaurantSearchParams> }) {
  const params = await searchParams;
  const filters = readFilters(params, dateToISO(new Date()));
  const queryClient = getQueryClient();
  const tab = normalizeOperationsTab(params.tab);
  if (tab === "dayparts") prefetch(queryClient, restaurantQueries.dayparts(filters));
  else if (tab === "channels") prefetch(queryClient, restaurantQueries.channels(filters));
  else prefetch(queryClient, restaurantQueries.speed(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OperationsView tab={tab} filters={filters} />
    </HydrationBoundary>
  );
}
