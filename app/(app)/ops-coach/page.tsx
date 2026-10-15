import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { OpsCoachView } from "@/features/restaurant-os/ops-coach-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Ops Coach" };
export const dynamic = "force-dynamic";

/** The Ops Coach (SPEC-385): the latest day's briefs start here. */
export default function OpsCoachPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.setup());
  prefetch(queryClient, restaurantQueries.coach(null));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OpsCoachView />
    </HydrationBoundary>
  );
}
