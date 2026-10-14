import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ReturnsSpikeView } from "@/features/orders/returns-spike-view";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Returns Spike" };
export const dynamic = "force-dynamic";

/** Subpage for the dashboard's Returns Spike card (SPEC-070). Replaces the
 * SPEC-060 modal — every other alert card drills into a breadcrumbed subpage,
 * not a dialog, so this one does too. Streams its data into the client cache
 * (SPEC-230) instead of waiting for it. */
export default function ReturnsSpikePage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, dashboardQueries.returnsSpikeTop());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReturnsSpikeView />
    </HydrationBoundary>
  );
}
