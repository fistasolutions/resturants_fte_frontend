import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { PosView } from "@/features/restaurant-os/pos-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Order Taking" };
export const dynamic = "force-dynamic";

/** Order Taking (SPEC-379): the branch list starts here; the branch's menu follows in the browser. */
export default function PosPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.branches());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PosView />
    </HydrationBoundary>
  );
}
