import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SystemOverviewTab } from "@/features/system/system-tab-views";
import { systemQueries } from "@/lib/queries/system";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "System" };
export const dynamic = "force-dynamic";

/** Content only — the header and tab bar live in the persistent shell (SPEC-229);
 * the overview streams into the client cache (SPEC-230). */
export default function SystemPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, systemQueries.jobs());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SystemOverviewTab />
    </HydrationBoundary>
  );
}
