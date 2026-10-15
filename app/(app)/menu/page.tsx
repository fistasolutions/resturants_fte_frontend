import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { MenuView } from "@/features/restaurant/menu-view";
import { BranchMenuTab } from "@/features/restaurant-os/branch-menu-tab";
import { CatalogTab } from "@/features/restaurant-os/catalog-tab";
import { OffersTab } from "@/features/restaurant-os/offers-tab";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { normalizeMenuTab, readFilters, type RestaurantSearchParams } from "@/lib/restaurant";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Menu" };
export const dynamic = "force-dynamic";

/** Content only — the header and the period live in the persistent shell (SPEC-232); the read
 * starts here and streams into the client cache (SPEC-230). */
export default async function Page({ searchParams }: { searchParams: Promise<RestaurantSearchParams> }) {
  const params = await searchParams;
  const filters = readFilters(params, dateToISO(new Date()));
  const queryClient = getQueryClient();
  const tab = normalizeMenuTab(params.tab);
  if (tab === "engineering") prefetch(queryClient, restaurantQueries.menu(filters));
  else if (tab === "branch") prefetch(queryClient, restaurantQueries.branches());
  else prefetch(queryClient, restaurantQueries.catalog());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {tab === "catalog" ? <CatalogTab /> : tab === "offers" ? <OffersTab /> : tab === "branch" ? <BranchMenuTab /> : <MenuView filters={filters} />}
    </HydrationBoundary>
  );
}
