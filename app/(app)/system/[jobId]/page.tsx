import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { JobRunsView } from "@/features/system/job-runs-view";
import { systemQueries } from "@/lib/queries/system";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { isStatus, isWindow } from "@/lib/system-trace";

export const metadata: Metadata = { title: "Job runs" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function JobRunsPage({ params, searchParams }: PageProps) {
  const [{ jobId }, sp] = await Promise.all([params, searchParams]);
  const status = isStatus(sp.status) ? sp.status : undefined;
  const window = isWindow(sp.window) ? sp.window : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  // Parallel, never a waterfall (root Rule 5); streamed into the client cache (SPEC-230).
  const queryClient = getQueryClient();
  prefetch(queryClient, systemQueries.jobs());
  prefetch(queryClient, systemQueries.runs({ jobId, status, window, page }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JobRunsView jobId={jobId} status={status} window={window} page={page} />
    </HydrationBoundary>
  );
}
