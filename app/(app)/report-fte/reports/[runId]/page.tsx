import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ReportPageTab } from "@/features/report-fte/report-fte-tab-pages";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Report" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ runId: string }>;
}

/** One generated report, full width (SPEC-286). Bare — the shell does not frame it. */
export default async function Page({ params }: PageProps) {
  const { runId: raw } = await params;
  const runId = Number.parseInt(raw, 10);
  if (!Number.isFinite(runId) || runId <= 0) notFound();
  const queryClient = getQueryClient();
  prefetch(queryClient, reportFteQueries.composer(runId));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportPageTab runId={runId} />
    </HydrationBoundary>
  );
}
