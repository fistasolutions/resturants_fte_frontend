import type { Metadata } from "next";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CustomerSupportView } from "@/features/customer-support/customer-support-view";
import { OverviewSkeleton } from "@/features/customer-support/skeletons";
import { normalizeSupportTab } from "@/lib/customer-support";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { integrationQueries } from "@/lib/queries/integrations";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { approvalsViewFrom } from "@/lib/support-approvals";
import { inboxViewFrom } from "@/lib/support-inbox";

export const metadata: Metadata = { title: "Customer Support Agent" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * Content only — the breadcrumb, header, strip and tab bar live in the persistent shell
 * (SPEC-232). The reads the opening tab needs start here, unawaited, and stream into the
 * client cache (SPEC-230): the helpdesk connection, the workspace, and that tab's own read.
 * Later tab switches move the URL with `history.pushState` and read from the cache.
 */
export default async function CustomerSupportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = normalizeSupportTab(params.tab);
  const queryClient = getQueryClient();
  prefetch(queryClient, integrationQueries.overview());
  prefetch(queryClient, customerSupportQueries.workspace());
  if (tab === "overview") prefetch(queryClient, customerSupportQueries.overview());
  else if (tab === "inbox") {
    const view = inboxViewFrom(new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined)));
    prefetch(queryClient, customerSupportQueries.inbox(view.queue, view.sort, view.page));
  } else if (tab === "approvals") {
    const view = approvalsViewFrom(new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined)));
    prefetch(queryClient, customerSupportQueries.approvalsPage(view));
  }
  else if (tab === "topics") prefetch(queryClient, customerSupportQueries.topics());
  else if (tab === "knowledge") prefetch(queryClient, customerSupportQueries.knowledge());
  else if (tab === "insights") prefetch(queryClient, customerSupportQueries.insights());
  else if (tab === "performance") prefetch(queryClient, customerSupportQueries.performance());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<OverviewSkeleton />}>
        <CustomerSupportView />
      </Suspense>
    </HydrationBoundary>
  );
}
