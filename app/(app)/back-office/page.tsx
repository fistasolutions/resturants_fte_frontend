import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BackOfficeView } from "@/features/restaurant-os/back-office-view";
import { readBackOfficeTab } from "@/lib/back-office";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Back Office" };
export const dynamic = "force-dynamic";

/** The back office (SPEC-394): the crew and the clock, the schedule, inventory and food cost. */
export default async function BackOfficePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.setup());
  prefetch(queryClient, restaurantQueries.branches({ status: "open" }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BackOfficeView tab={readBackOfficeTab(tab)} />
    </HydrationBoundary>
  );
}
