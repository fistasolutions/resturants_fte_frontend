import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { StandardsView } from "@/features/restaurant-os/standards-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Brand Standards" };
export const dynamic = "force-dynamic";

/** Brand Standards (SPEC-392): the network's QSC visits start here. */
export default function StandardsPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.audits(null));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StandardsView />
    </HydrationBoundary>
  );
}
