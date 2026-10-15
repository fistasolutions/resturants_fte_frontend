import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { RoyaltiesView } from "@/features/restaurant/royalties-view";
import { StatementsView } from "@/features/restaurant/statements-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import {
  normalizeRoyaltyTab,
  normalizeStatementStatus,
  readFilters,
  type RestaurantSearchParams,
} from "@/lib/restaurant";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Royalties" };
export const dynamic = "force-dynamic";

/** Content only — the header and the period live in the persistent shell (SPEC-232); the read
 * starts here and streams into the client cache (SPEC-230). */
export default async function Page({ searchParams }: { searchParams: Promise<RestaurantSearchParams> }) {
  const params = await searchParams;
  const filters = readFilters(params, dateToISO(new Date()));
  const queryClient = getQueryClient();
  const tab = normalizeRoyaltyTab(params.tab);
  if (tab === "statements") {
    prefetch(queryClient, restaurantQueries.setup());
    prefetch(queryClient, restaurantQueries.statements(normalizeStatementStatus(params.status)));
  } else prefetch(queryClient, restaurantQueries.royalties(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {tab === "statements" ? <StatementsView /> : <RoyaltiesView filters={filters} />}
    </HydrationBoundary>
  );
}
