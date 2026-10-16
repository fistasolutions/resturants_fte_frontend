import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ReputationView } from "@/features/restaurant-os/reputation-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Reputation Manager" };
export const dynamic = "force-dynamic";

/** The Reputation Manager (SPEC-390): the last 30 days of ratings start here. */
export default function ReputationPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.reputation(30, null, null));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReputationView />
    </HydrationBoundary>
  );
}
