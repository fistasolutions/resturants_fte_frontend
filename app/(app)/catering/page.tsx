import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CateringView } from "@/features/restaurant-os/catering-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Catering Desk" };
export const dynamic = "force-dynamic";

/** The Catering Desk (SPEC-391): the inquiries start here. */
export default function CateringPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.catering());
  prefetch(queryClient, restaurantQueries.branches({ status: "open" }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CateringView />
    </HydrationBoundary>
  );
}
