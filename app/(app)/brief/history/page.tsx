import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BriefHistoryView } from "@/features/brief/brief-history-view";
import { briefQueries } from "@/lib/queries/brief";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Brief History" };
export const dynamic = "force-dynamic";

interface BriefHistoryPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BriefHistoryPage({ searchParams }: BriefHistoryPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const queryClient = getQueryClient();
  prefetch(queryClient, briefQueries.history(page, 10));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BriefHistoryView page={page} />
    </HydrationBoundary>
  );
}
