import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { NexusPageView } from "@/features/tax-reports/nexus-page-view";
import { planningQueries } from "@/lib/queries/planning";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Nexus Watch — Sales & Tax" };
export const dynamic = "force-dynamic";

/**
 * Nexus Watch (SPEC-221). Uses the same shell every other sub-route uses — `main`
 * with the house padding, the shared breadcrumb, then `PageHeader`. The thresholds
 * stream into the client cache (SPEC-230).
 */
export default function NexusPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, planningQueries.nexus());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NexusPageView />
    </HydrationBoundary>
  );
}
