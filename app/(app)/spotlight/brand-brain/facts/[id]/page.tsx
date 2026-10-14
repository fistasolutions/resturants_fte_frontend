import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { FactPageView } from "@/features/brand-brain/fact-page-view";
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
  return { title: parseId(id) ? "Fact — Brand Brain" : "Brand Brain" };
}

/** One fact (SPEC-274): the fact with its source and history, plus the facts read for
 * the related list — both started here and streamed to the cache. */
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const numeric = parseId(id);
  if (numeric === null) notFound();
  const queryClient = getQueryClient();
  prefetch(queryClient, brandBrainQueries.fact(numeric));
  prefetch(queryClient, brandBrainQueries.facts());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FactPageView id={numeric} />
    </HydrationBoundary>
  );
}
