import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ReportsView } from "@/features/reports/reports-view";
import { reportQueries } from "@/lib/queries/reports";
import { getQueryClient } from "@/lib/query-client";
import { normalizePeriod } from "@/lib/report-period";
import { normalizeScope } from "@/lib/report-scope";
import { prefetch } from "@/lib/server-prefetch";
import { isValidISODate } from "@/utils/date";

export const metadata: Metadata = {
  title: "Daily Reports",
};

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<{ date?: string; scope?: string; period?: string }>;
}

/** Parses the URL, starts the fetches, renders — without waiting (SPEC-230). */
export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const scope = normalizeScope(params.scope);
  // Period rollup (D-08) applies only to the store-wide ("all") view.
  const period = scope === "all" ? normalizePeriod(params.period) : "daily";
  const requestedDate = params.date && isValidISODate(params.date) ? params.date : null;

  const queryClient = getQueryClient();
  prefetch(queryClient, reportQueries.list(5));
  prefetch(queryClient, reportQueries.scopes());
  // The stored report for an explicit date can start now; "the latest" has to wait
  // for the list and is fetched by the view once it knows the date.
  if (period === "daily" && requestedDate) {
    prefetch(queryClient, reportQueries.detail(requestedDate, scope));
  }
  if (period !== "daily") {
    prefetch(queryClient, reportQueries.rollup(period, requestedDate ?? undefined));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportsView scope={scope} period={period} requestedDate={requestedDate} />
    </HydrationBoundary>
  );
}
