import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ForecastTab } from "@/features/foresight/foresight-tab-views";
import { foresightQueries } from "@/lib/queries/foresight";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Forecast & Pace — Foresight" };
export const dynamic = "force-dynamic";

export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, foresightQueries.forecast());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ForecastTab />
    </HydrationBoundary>
  );
}
