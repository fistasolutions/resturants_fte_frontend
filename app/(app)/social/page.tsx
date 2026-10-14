import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SocialTabContent } from "@/features/social/social-tab-content";
import { normalizeSocialTab } from "@/lib/social";
import { socialQueries } from "@/lib/queries/social";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Social Media Manager",
};

export const dynamic = "force-dynamic";

interface SocialPageProps {
  searchParams: Promise<{ tab?: string }>;
}

/** Header + tab bar are rendered by the persistent shell (social layout.tsx). The
 * active tab's query starts here and streams into the client cache (SPEC-230): a
 * tab change is a different key — skeleton the first time, instant thereafter. */
export default async function SocialPage({ searchParams }: SocialPageProps) {
  const { tab } = await searchParams;
  const activeTab = normalizeSocialTab(tab);

  const queryClient = getQueryClient();
  if (activeTab === "content-studio") prefetch(queryClient, socialQueries.studioProducts());
  else if (activeTab === "calendar") prefetch(queryClient, socialQueries.calendar());
  else if (activeTab === "approvals") prefetch(queryClient, socialQueries.approvals());
  else if (activeTab === "performance") prefetch(queryClient, socialQueries.performance());
  else prefetch(queryClient, socialQueries.overview());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SocialTabContent activeTab={activeTab} />
    </HydrationBoundary>
  );
}
