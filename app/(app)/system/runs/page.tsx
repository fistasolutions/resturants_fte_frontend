import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { AllRunsTab } from "@/features/system/system-tab-views";
import { systemQueries } from "@/lib/queries/system";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { isStatus, isWindow } from "@/lib/system-trace";

export const metadata: Metadata = { title: "All runs" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Every job's runs in one table — for "what failed last night", rather than
 * "how is this one job", which is what `/system/[jobId]` answers.
 *
 * Content only: the header and tab bar live in the persistent shell (SPEC-229); the
 * page streams into the client cache (SPEC-230), so a page visited before is instant. */
export default async function AllRunsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = isStatus(sp.status) ? sp.status : undefined;
  const window = isWindow(sp.window) ? sp.window : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const queryClient = getQueryClient();
  prefetch(queryClient, systemQueries.runs({ status, window, page }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AllRunsTab status={status} window={window} page={page} />
    </HydrationBoundary>
  );
}
