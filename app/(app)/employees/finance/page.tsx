import type { Metadata } from "next";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { FinanceSkeleton } from "@/features/finance/finance-skeleton";
import { FinanceView } from "@/features/finance/finance-view";
import { financeQueries } from "@/lib/queries/finance";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Accounts Payable" };
export const dynamic = "force-dynamic";

/** Content only — the breadcrumb, header and tab bar live in the persistent shell
 * (SPEC-232). Both reads are started here and streamed into the client cache without
 * being awaited (SPEC-230). The page does not read the URL: the payable is fetched
 * whole and the filters narrow it in the browser, so every tile is one frame and a
 * bookmarked filter costs no extra request (SPEC-299). */
export default function FinancePage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, financeQueries.ap());
  prefetch(queryClient, financeQueries.connections());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<FinanceSkeleton />}>
        <FinanceView />
      </Suspense>
    </HydrationBoundary>
  );
}
