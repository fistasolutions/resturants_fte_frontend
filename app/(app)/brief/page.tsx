import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BriefView } from "@/features/brief/brief-view";
import {
  compareRangeFor,
  formatRangeLabel,
  resolveCompareMode,
  resolveDateRange,
} from "@/lib/date-range";
import { briefQueries } from "@/lib/queries/brief";
import { clarityQueries } from "@/lib/queries/clarity";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO, isValidISODate } from "@/utils/date";
import { getWorkspace } from "@/services/workspace";

export const metadata: Metadata = { title: "Morning Brief" };
export const dynamic = "force-dynamic";

interface BriefPageProps {
  searchParams: Promise<{
    date?: string;
    range?: string;
    from?: string;
    to?: string;
    compare?: string;
  }>;
}

/**
 * Parses the URL, starts the fetches, renders — without waiting (SPEC-230).
 *
 * The three prefetches below are not awaited: their pending promises are dehydrated
 * into the RSC payload and streamed to the browser, where `BriefView` observes them
 * from the session cache. So this page renders in milliseconds on every visit; the
 * data arrives when it arrives on the first one, and is already on screen on the next.
 */
export default async function BriefPage({ searchParams }: BriefPageProps) {
  const params = await searchParams;
  const requestedDate = params.date && isValidISODate(params.date) ? params.date : null;
  const isArchive = requestedDate !== null;

  const todayISO = dateToISO(new Date());
  const range = resolveDateRange(params, todayISO);
  // SPEC-318: the layout's cached workspace read — no added round trip.
  const { calendarSystem } = await getWorkspace();
  const compare = resolveCompareMode(params.compare, calendarSystem);
  // The actual compared-against date/range (e.g. "Jul 31, 2026"), not a
  // generic "vs previous period" label (SPEC-076 client feedback) — pure
  // client-side mirror of the backend's compare window, same helper
  // Dashboard's picker already uses for its own math.
  const compareRange = compareRangeFor(range.from, range.to, compare);
  const comparePeriodLabel = compareRange
    ? formatRangeLabel(compareRange.from, compareRange.to)
    : null;

  const queryClient = getQueryClient();
  prefetch(queryClient, briefQueries.history(1, 7));
  prefetch(
    queryClient,
    requestedDate
      ? briefQueries.byDate(requestedDate)
      : briefQueries.data({ from: range.from, to: range.to, compare }),
  );
  // "Needs Attention" is always live "right now" — skip it in the frozen
  // archive view (SPEC-104), and skip the fetch too (root Rule 5).
  if (!isArchive) prefetch(queryClient, briefQueries.attention());
  if (!isArchive) prefetch(queryClient, clarityQueries.brokeYesterday());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BriefView
        requestedDate={requestedDate}
        range={range}
        compare={compare}
        comparePeriodLabel={comparePeriodLabel}
      />
    </HydrationBoundary>
  );
}
