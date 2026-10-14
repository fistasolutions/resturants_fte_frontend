import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { WebsitePageView } from "@/features/traffic/website-page-view";
import { clarityQueries } from "@/lib/queries/clarity";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Page friction" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ handle: string }>;
}

/** One product page's friction from Clarity (SPEC-282) — a sub-page of the
 * Website tab, passed bare by the Traffic shell; it owns its breadcrumb + header. */
export default async function WebsiteFrictionPage({ params }: PageProps) {
  const { handle } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, clarityQueries.frictionPage(handle));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WebsitePageView handle={handle} />
    </HydrationBoundary>
  );
}
