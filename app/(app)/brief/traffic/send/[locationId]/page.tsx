import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ComposeTrafficView } from "@/features/brief/compose-traffic-view";
import { briefQueries } from "@/lib/queries/brief";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Send Store Traffic Nudge" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locationId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { locationId } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, briefQueries.traffic());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ComposeTrafficView locationId={locationId} />
    </HydrationBoundary>
  );
}
