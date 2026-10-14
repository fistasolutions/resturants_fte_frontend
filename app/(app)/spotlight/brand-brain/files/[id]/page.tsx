import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SourcePageView } from "@/features/brand-brain/source-page-view";
import { brandBrainQueries } from "@/lib/queries/brand-brain";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: parseId(id) ? "Knowledge Base item — Brand Brain" : "Brand Brain" };
}

/** One Knowledge Base item (SPEC-274): the item with its history, its facts, and the
 * three shared reads its other streams filter — all started here, streamed to the cache. */
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const numeric = parseId(id);
  if (numeric === null) notFound();
  const queryClient = getQueryClient();
  prefetch(queryClient, brandBrainQueries.source(numeric));
  prefetch(queryClient, brandBrainQueries.sourceFacts(numeric));
  prefetch(queryClient, brandBrainQueries.voice());
  prefetch(queryClient, brandBrainQueries.rules());
  prefetch(queryClient, brandBrainQueries.personas());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SourcePageView id={numeric} />
    </HydrationBoundary>
  );
}
