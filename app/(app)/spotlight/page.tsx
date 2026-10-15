import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SpotlightTabContent } from "@/features/spotlight/spotlight-tab-content";
import { chatQueries } from "@/lib/queries/chat";
import { clarityQueries } from "@/lib/queries/clarity";
import { moneyPageQueries } from "@/lib/queries/money-pages";
import { spotlightQueries } from "@/lib/queries/spotlight";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { normalizeSpotlightTab } from "@/lib/spotlight";

export const metadata: Metadata = {
  title: "Search Visibility",
};

export const dynamic = "force-dynamic";

interface SpotlightPageProps {
  searchParams: Promise<{ tab?: string; date?: string }>;
}

/** A "YYYY-MM-DD" `?date=` value, or undefined for anything malformed — an
 * untrusted param never reaches a backend path. */
function normalizePickDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

/** Header + tab bar are rendered by the persistent shell (spotlight layout.tsx). The
 * active tab's queries start here and stream into the client cache (SPEC-230). A
 * past Daily Picks date is prefetched too, so the day change never waits. */
export default async function SpotlightPage({ searchParams }: SpotlightPageProps) {
  const { tab, date } = await searchParams;
  const activeTab = normalizeSpotlightTab(tab);
  // Brand Brain is its own route since SPEC-263; shared `?tab=brand-brain` links keep working.
  if (activeTab === "brand-brain") redirect("/spotlight/brand-brain/coverage");
  const pickDate = normalizePickDate(date);

  const queryClient = getQueryClient();
  if (activeTab === "chat") prefetch(queryClient, chatQueries.employeeConversations("spotlight"));
  else if (activeTab === "inbound") prefetch(queryClient, spotlightQueries.inboundTopics());
  else if (activeTab === "daily-picks") {
    prefetch(queryClient, spotlightQueries.dailyPicks());
    prefetch(queryClient, spotlightQueries.dailyPicksHistory());
    prefetch(queryClient, spotlightQueries.drafts());
    if (pickDate) prefetch(queryClient, spotlightQueries.dailyPicksForDate(pickDate));
  } else if (activeTab === "approvals") prefetch(queryClient, spotlightQueries.approvals());
  else if (activeTab === "published") {
    prefetch(queryClient, spotlightQueries.published());
    prefetch(queryClient, spotlightQueries.unpublished());
    prefetch(queryClient, spotlightQueries.visibility());
    prefetch(queryClient, spotlightQueries.journeyCoverage());
    prefetch(queryClient, clarityQueries.blogEngagement());
    prefetch(queryClient, spotlightQueries.refresh());
  } else if (activeTab === "money-pages") prefetch(queryClient, moneyPageQueries.list());
  else if (activeTab === "local-pages") prefetch(queryClient, spotlightQueries.localPages());
  else if (activeTab === "visibility") {
    prefetch(queryClient, spotlightQueries.visibility());
    prefetch(queryClient, spotlightQueries.strikingDistance());
  }
  else prefetch(queryClient, spotlightQueries.overview());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SpotlightTabContent activeTab={activeTab} date={pickDate} />
    </HydrationBoundary>
  );
}
