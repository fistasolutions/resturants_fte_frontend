import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TeamPerformanceVoiceTab } from "@/features/team-performance/tp-voice-tab";
import { resolveDateRange } from "@/lib/date-range";
import { withWorkspaceDefaultRange } from "@/lib/gorgias-tabs";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Voice of Customer" };
export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function VoiceOfCustomerPage({ searchParams }: PageProps) {
  const range = resolveDateRange(withWorkspaceDefaultRange(await searchParams), todayISO());
  const queryClient = getQueryClient();
  prefetch(queryClient, gorgiasQueries.voiceOfCustomer(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamPerformanceVoiceTab range={range} />
    </HydrationBoundary>
  );
}
