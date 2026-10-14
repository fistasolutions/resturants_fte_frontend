import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { HealthPageView } from "@/features/customers/health-page-view";
import { customerQueries } from "@/lib/queries/customers";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Customer Health" };
export const dynamic = "force-dynamic";

export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, customerQueries.health());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HealthPageView />
    </HydrationBoundary>
  );
}
