import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CashView } from "@/features/restaurant-os/cash-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Cash & Day Close" };
export const dynamic = "force-dynamic";

/** Cash & Day Close (SPEC-380): the branch list starts here; the drawer and the day follow. */
export default function CashPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.branches());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CashView />
    </HydrationBoundary>
  );
}
