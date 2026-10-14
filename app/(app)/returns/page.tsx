import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ReturnsTabContent } from "@/features/returns/returns-tab-content";
import { resolveCompareMode, resolveDateRange } from "@/lib/date-range";
import { returnQueries } from "@/lib/queries/returns";
import { normalizeReturnsTab } from "@/lib/returns-tabs";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";
import { getWorkspace } from "@/services/workspace";

export const metadata: Metadata = {
  title: "Returns Intelligence",
};

export const dynamic = "force-dynamic";


interface ReturnsPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    compare?: string;
    tab?: string;
    category?: string;
  }>;
}

/** Header + tab bar are rendered by the persistent shell (returns layout.tsx). The
 * active tab's queries start here and stream into the client cache (SPEC-230); a
 * tab / range / category change is a different key, so it shows the skeleton at
 * once the first time and paints instantly thereafter. */
export default async function ReturnsPage({ searchParams }: ReturnsPageProps) {
  const params = await searchParams;
  const range = resolveDateRange(params, dateToISO(new Date()));
  // SPEC-318: the layout's cached workspace read — no added round trip.
  const { calendarSystem } = await getWorkspace();
  const compare = resolveCompareMode(params.compare, calendarSystem);
  const activeTab = normalizeReturnsTab(params.tab);
  const category = params.category;
  const q = { from: range.from, to: range.to };

  const queryClient = getQueryClient();
  if (activeTab === "overview") {
    prefetch(queryClient, returnQueries.overview(q));
    prefetch(queryClient, returnQueries.metrics({ ...q, compare }));
    prefetch(queryClient, returnQueries.byStyle(q));
  } else if (activeTab === "by-style") {
    prefetch(queryClient, returnQueries.byStyle(q));
  } else if (activeTab === "sizing") {
    prefetch(queryClient, returnQueries.bySize(q));
  } else if (activeTab === "fixes") {
    prefetch(queryClient, returnQueries.fixes(q));
  } else if (activeTab === "bracketing") {
    prefetch(queryClient, returnQueries.bracketing(q));
  } else {
    prefetch(queryClient, returnQueries.byCategory(q));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReturnsTabContent
        activeTab={activeTab}
        from={range.from}
        to={range.to}
        compare={compare}
        category={category}
      />
    </HydrationBoundary>
  );
}
