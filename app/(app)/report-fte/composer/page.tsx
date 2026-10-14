import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ComposerStarter, ComposerTab } from "@/features/report-fte/report-fte-tab-pages";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Composer" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ run?: string; ask?: string; autorun?: string }>;
}

/** Report FTE → Composer (SPEC-285). `?run=` opens a run — its plan and draft stream
 * into the client cache (SPEC-230); `?ask=` (a deep link) creates one on arrival. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const runId = Number.parseInt(params.run ?? "", 10);
  const ask = params.ask?.trim() ? params.ask.trim() : null;
  const queryClient = getQueryClient();
  prefetch(queryClient, reportFteQueries.desk());
  if (Number.isFinite(runId) && runId > 0) {
    prefetch(queryClient, reportFteQueries.composer(runId));
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ComposerTab runId={runId} autorun={params.autorun === "1"} />
      </HydrationBoundary>
    );
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ComposerStarter ask={ask} />
    </HydrationBoundary>
  );
}
