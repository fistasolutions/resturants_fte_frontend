import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { StockoutTab } from "@/features/foresight/foresight-tab-views";
import { foresightQueries } from "@/lib/queries/foresight";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Stockout Risk — Foresight" };
export const dynamic = "force-dynamic";

export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, foresightQueries.stockout());
  prefetch(queryClient, foresightQueries.stockoutAccuracy());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StockoutTab />
    </HydrationBoundary>
  );
}
