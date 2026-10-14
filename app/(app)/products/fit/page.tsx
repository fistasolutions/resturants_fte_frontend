import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { FitView } from "@/features/fit/fit-view";
import { fitQueries } from "@/lib/queries/fit";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Fit" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Products → Fit (SPEC-306). Renders inside the persistent product shell; the overview
 * streams into the client cache (SPEC-230). It reads the whole return history, so it takes
 * no date range. */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, fitQueries.overview());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FitView />
    </HydrationBoundary>
  );
}
