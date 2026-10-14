import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CompetitorPageView } from "@/features/brand-brain/competitor-page-view";
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
  return { title: parseId(id) ? "Competitor — Brand Brain" : "Brand Brain" };
}

/** One competitor (SPEC-283), started here and streamed to the cache. */
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const numeric = parseId(id);
  if (numeric === null) notFound();
  const queryClient = getQueryClient();
  prefetch(queryClient, brandBrainQueries.competitor(numeric));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CompetitorPageView id={numeric} />
    </HydrationBoundary>
  );
}
