import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { RepeatClockPageView } from "@/features/customers/repeat-clock-page-view";
import { customerQueries } from "@/lib/queries/customers";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Repeat Clock" };
export const dynamic = "force-dynamic";

export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, customerQueries.repeatClock());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RepeatClockPageView />
    </HydrationBoundary>
  );
}
