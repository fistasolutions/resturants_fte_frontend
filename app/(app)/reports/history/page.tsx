import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ReportHistoryView } from "@/features/reports/report-history-view";
import { REPORT_HISTORY_PAGE_SIZE as HISTORY_PAGE_SIZE } from "@/lib/page-sizes";
import { reportQueries } from "@/lib/queries/reports";
import { getQueryClient } from "@/lib/query-client";
import { isValidScope } from "@/lib/report-scope";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Report History",
};

export const dynamic = "force-dynamic";

interface HistoryPageProps {
  searchParams: Promise<{ q?: string; type?: string; scope?: string; page?: string }>;
}

/** Parses the URL, starts the fetches, renders — without waiting (SPEC-230). Pagination
 * stays SERVER-SIDE — each page is its own API call with limit/offset (SPEC-029). */
export default async function ReportHistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 80);
  const type = ["daily", "vendor", "location"].includes(params.type ?? "")
    ? (params.type as string)
    : null;
  const scope =
    params.scope && params.scope !== "all" && isValidScope(params.scope)
      ? params.scope
      : null;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const queryClient = getQueryClient();
  prefetch(
    queryClient,
    reportQueries.history({
      q: q || null,
      type,
      scope,
      limit: HISTORY_PAGE_SIZE,
      offset: (page - 1) * HISTORY_PAGE_SIZE,
    }),
  );
  prefetch(queryClient, reportQueries.scopes());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportHistoryView q={q} type={type} scope={scope} page={page} />
    </HydrationBoundary>
  );
}
