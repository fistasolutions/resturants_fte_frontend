import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DevelopmentView } from "@/features/restaurant-os/development-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Franchise Development" };
export const dynamic = "force-dynamic";

/** Franchise development (SPEC-395): prospects and new-store openings. */
export default function DevelopmentPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.development());
  prefetch(queryClient, restaurantQueries.franchisees());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DevelopmentView />
    </HydrationBoundary>
  );
}
