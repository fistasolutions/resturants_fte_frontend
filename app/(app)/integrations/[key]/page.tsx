import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { IntegrationDetailView } from "@/features/integrations/integration-detail-view";
import { APPS, isIntegrationKey } from "@/lib/integration-catalog";
import { financeQueries } from "@/lib/queries/finance";
import { integrationQueries } from "@/lib/queries/integrations";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  return { title: isIntegrationKey(key) ? `${APPS[key].name} · Integrations` : "Integrations" };
}

/** One app's page (SPEC-328). Its reads start together and stream into the client cache
 * (SPEC-230): the overview it shares with the hub, and whatever its Settings tab edits. */
export default async function IntegrationPage({ params }: Props) {
  const { key } = await params;
  if (!isIntegrationKey(key)) notFound();
  const queryClient = getQueryClient();
  prefetch(queryClient, integrationQueries.overview());
  if (APPS[key].kind === "key") prefetch(queryClient, integrationQueries.settings());
  if (key === "gsc") prefetch(queryClient, integrationQueries.googleStatus());
  if (key === "meta") prefetch(queryClient, integrationQueries.metaStatus());
  if (key === "quickbooks") prefetch(queryClient, financeQueries.connections());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IntegrationDetailView appKey={key} />
    </HydrationBoundary>
  );
}
