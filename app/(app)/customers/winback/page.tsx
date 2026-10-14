import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { WinbackPageView } from "@/features/customers/winback-page-view";
import { WINBACK_PAGE_SIZE } from "@/lib/page-sizes";
import { briefQueries } from "@/lib/queries/brief";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { parseWinbackFilters } from "@/lib/winback-filters";

export const metadata: Metadata = { title: "Winback List" };
export const dynamic = "force-dynamic";

interface WinbackPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Winback review + Klaviyo sync (SPEC-053). Relocated from `/brief/winback` to
 * live under Customers (SPEC-091) — the Customers "Drifting VIPs" card is its
 * entry point, so its home belongs here; the Morning Brief now redirects in. */
export default async function WinbackReviewPage({ searchParams }: WinbackPageProps) {
  const filters = parseWinbackFilters(await searchParams);
  const queryClient = getQueryClient();
  prefetch(
    queryClient,
    briefQueries.winback({
      page: filters.page,
      limit: WINBACK_PAGE_SIZE,
      q: filters.q,
      minSpend: filters.minSpend,
      minSilent: filters.minSilent,
    }),
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WinbackPageView filters={filters} />
    </HydrationBoundary>
  );
}
