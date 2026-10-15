import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { GuestsView } from "@/features/restaurant/guests-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { readFilters, type RestaurantSearchParams } from "@/lib/restaurant";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Guests" };
export const dynamic = "force-dynamic";

/** Content only — the header and the period live in the persistent shell (SPEC-232); the read
 * starts here and streams into the client cache (SPEC-230). */
export default async function Page({ searchParams }: { searchParams: Promise<RestaurantSearchParams> }) {
  const params = await searchParams;
  const filters = readFilters(params, dateToISO(new Date()));
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.guests(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GuestsView filters={filters} />
    </HydrationBoundary>
  );
}
