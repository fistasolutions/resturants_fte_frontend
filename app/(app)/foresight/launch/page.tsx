import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { LaunchWatchTab } from "@/features/foresight/foresight-tab-views";
import { foresightQueries } from "@/lib/queries/foresight";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Launch Watch — Foresight" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WATCH_DAYS = 45;

/** Foresight → Launch Watch (SPEC-192). Renders inside the persistent foresight
 * shell. No date range: a drop's window is its own age, not a picked period. The
 * data streams into the client cache (SPEC-230). */
export default function LaunchWatchPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, foresightQueries.launchWatch(WATCH_DAYS));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LaunchWatchTab watchDays={WATCH_DAYS} />
    </HydrationBoundary>
  );
}
