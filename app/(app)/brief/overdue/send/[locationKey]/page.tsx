import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ComposeOverdueView } from "@/features/brief/compose-overdue-view";
import { briefQueries } from "@/lib/queries/brief";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Send Overdue Orders" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locationKey: string }>;
}

export default async function Page({ params }: PageProps) {
  const { locationKey } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, briefQueries.overdue());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ComposeOverdueView locationKey={locationKey} />
    </HydrationBoundary>
  );
}
