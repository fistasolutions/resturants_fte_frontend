import type { Metadata } from "next";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { PlansSkeleton } from "@/features/ci/plans-skeleton";
import { PlansView } from "@/features/ci/plans-view";
import { ciPlanQueries } from "@/lib/queries/ci-plans";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Plans · Continuous Innovation" };

/** The Plans list (SPEC-272): one read, prefetched and streamed into the client cache
 * (SPEC-230). The status filter lives in the URL, so the view reads `useSearchParams`
 * behind a boundary. */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, ciPlanQueries.list());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<PlansSkeleton />}>
        <PlansView />
      </Suspense>
    </HydrationBoundary>
  );
}
