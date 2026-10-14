import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BrandBrainSection } from "@/features/brand-brain/brand-brain-section";
import { brandBrainSectionLabel, isBrandBrainSection, LEGACY_SECTION_REDIRECTS } from "@/lib/brand-brain";
import { brandBrainQueries } from "@/lib/queries/brand-brain";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PageProps {
  params: Promise<{ section: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  return { title: isBrandBrainSection(section) ? `${brandBrainSectionLabel(section)} — Brand Brain` : "Brand Brain" };
}

/**
 * One Brand Brain sub-tab (SPEC-263). Only this section's queries start here and
 * stream into the client cache (SPEC-230); the shells above never re-render.
 */
export default async function BrandBrainSectionPage({ params }: PageProps) {
  const { section } = await params;
  // Measured and History folded into Facts and Coverage (SPEC-281).
  if (LEGACY_SECTION_REDIRECTS[section]) redirect(LEGACY_SECTION_REDIRECTS[section]);
  if (!isBrandBrainSection(section)) notFound();

  const queryClient = getQueryClient();
  switch (section) {
    case "coverage":
      prefetch(queryClient, brandBrainQueries.coverage());
      prefetch(queryClient, brandBrainQueries.history());
      break;
    case "review":
      prefetch(queryClient, brandBrainQueries.researchReview());
      break;
    case "files":
      prefetch(queryClient, brandBrainQueries.sources());
      prefetch(queryClient, brandBrainQueries.coverage());
      break;
    case "facts":
      prefetch(queryClient, brandBrainQueries.facts());
      prefetch(queryClient, brandBrainQueries.sources());
      break;
    case "voice":
      prefetch(queryClient, brandBrainQueries.voice());
      prefetch(queryClient, brandBrainQueries.sources());
      break;
    case "guardrails":
      prefetch(queryClient, brandBrainQueries.facts());
      prefetch(queryClient, brandBrainQueries.rules());
      break;
    case "personas":
      prefetch(queryClient, brandBrainQueries.personas());
      break;
    case "competitors":
      prefetch(queryClient, brandBrainQueries.competitors());
      prefetch(queryClient, brandBrainQueries.competitorSummary());
      break;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BrandBrainSection section={section} />
    </HydrationBoundary>
  );
}
