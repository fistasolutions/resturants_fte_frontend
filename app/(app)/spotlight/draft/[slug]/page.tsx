import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DraftPageView } from "@/features/spotlight/draft-page-view";
import { spotlightQueries } from "@/lib/queries/spotlight";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Search Visibility · Draft" };
export const dynamic = "force-dynamic";

interface DraftPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SpotlightDraftPage({ params }: DraftPageProps) {
  // The ref is a slug for new links and a numeric id for older ones —
  // backend SPEC-167 resolves both, so shared `/draft/15` links keep working.
  const { slug } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, spotlightQueries.draft(slug));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DraftPageView slug={slug} />
    </HydrationBoundary>
  );
}
