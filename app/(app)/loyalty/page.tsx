import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { LoyaltyView } from "@/features/restaurant-os/loyalty-view";
import { readLoyaltyTab } from "@/lib/loyalty";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Loyalty & Gift Cards" };
export const dynamic = "force-dynamic";

/** Loyalty & Gift Cards (SPEC-383): the program, its members, gift cards and the settlement. */
export default async function LoyaltyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const current = readLoyaltyTab(tab);
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.setup());
  if (current === "program") prefetch(queryClient, restaurantQueries.loyalty());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LoyaltyView tab={current} />
    </HydrationBoundary>
  );
}
