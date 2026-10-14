"use client";

import { useState } from "react";

import { BrandBrainSectionSkeleton } from "@/features/brand-brain/brand-brain-section-skeleton";
import { CompetitorsView } from "@/features/brand-brain/competitors-view";
import { CoverageView } from "@/features/brand-brain/coverage-view";
import { FactsView } from "@/features/brand-brain/facts-view";
import { FilesView } from "@/features/brand-brain/files-view";
import { GuardrailsView } from "@/features/brand-brain/guardrails-view";
import { PersonasView } from "@/features/brand-brain/personas-view";
import { ResearchReviewView } from "@/features/brand-brain/research-review-view";
import { SectionError } from "@/features/brand-brain/section-error";
import { StyleGuideView } from "@/features/brand-brain/style-guide-view";
import { useBrandBrainRefresh } from "@/features/brand-brain/use-brand-brain-refresh";
import { VoiceView } from "@/features/brand-brain/voice-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { anyExtracting } from "@/lib/brand-brain";
import { brandBrainQueries } from "@/lib/queries/brand-brain";
import type { BrandBrainSection as Section } from "@/types/brand-brain";

/**
 * One Brand Brain sub-tab, read from the client cache (SPEC-230 / SPEC-263). Each
 * section observes only its own queries; the shells above are untouched by a switch.
 * Files polls its sources every 2 s while any is still extracting, and stops on its own.
 */
export function BrandBrainSection({ section }: { section: Section }) {
  const refresh = useBrandBrainRefresh();
  // Snapshot "now" at mount so the render stays pure (React 19 compiler).
  const [nowMs] = useState(() => Date.now());

  const coverage = useApiQuery(section === "coverage" || section === "files" ? brandBrainQueries.coverage() : null);
  const sources = useApiQuery(section === "files" || section === "facts" || section === "voice" ? brandBrainQueries.sources() : null, {
    refetchInterval: (query) => (query.state.data && anyExtracting(query.state.data) ? 2000 : false),
  });
  const wantsFacts = section === "facts" || section === "guardrails";
  const facts = useApiQuery(wantsFacts ? brandBrainQueries.facts() : null);
  const wantsRules = section === "guardrails" || section === "style-guide";
  const rules = useApiQuery(wantsRules ? brandBrainQueries.rules() : null);
  const voice = useApiQuery(section === "voice" ? brandBrainQueries.voice() : null);
  const personas = useApiQuery(section === "personas" ? brandBrainQueries.personas() : null);
  const history = useApiQuery(section === "coverage" ? brandBrainQueries.history() : null);
  const competitors = useApiQuery(section === "competitors" ? brandBrainQueries.competitors() : null);
  const competitorSummary = useApiQuery(section === "competitors" ? brandBrainQueries.competitorSummary() : null);
  const review = useApiQuery(section === "review" ? brandBrainQueries.researchReview() : null);

  switch (section) {
    case "coverage":
      if (coverage.isPending) return <BrandBrainSectionSkeleton />;
      if (coverage.isError) return <SectionError error={coverage.error} onRetry={() => void coverage.refetch()} />;
      // Recent changes decorate the page — coverage never waits for the history read.
      return <CoverageView data={coverage.data} events={history.data ?? []} onChanged={refresh} nowMs={nowMs} />;
    case "review":
      if (review.isPending) return <BrandBrainSectionSkeleton />;
      if (review.isError) return <SectionError error={review.error} onRetry={() => void review.refetch()} />;
      return <ResearchReviewView review={review.data} onChanged={refresh} />;
    case "files":
      if (sources.isPending) return <BrandBrainSectionSkeleton />;
      if (sources.isError) return <SectionError error={sources.error} onRetry={() => void sources.refetch()} />;
      // Coverage only decorates the tiles — the library never waits for it.
      return <FilesView sources={sources.data} coverage={coverage.data} onChanged={refresh} />;
    case "facts":
      if (facts.isPending) return <BrandBrainSectionSkeleton />;
      if (facts.isError) return <SectionError error={facts.error} onRetry={() => void facts.refetch()} />;
      return <FactsView facts={facts.data} sources={sources.data ?? []} onChanged={refresh} />;
    case "voice":
      if (voice.isPending) return <BrandBrainSectionSkeleton />;
      if (voice.isError) return <SectionError error={voice.error} onRetry={() => void voice.refetch()} />;
      return <VoiceView data={voice.data} sources={sources.data ?? []} onChanged={refresh} />;
    case "guardrails":
      if (facts.isPending || rules.isPending) return <BrandBrainSectionSkeleton />;
      if (facts.isError) return <SectionError error={facts.error} onRetry={() => void facts.refetch()} />;
      if (rules.isError) return <SectionError error={rules.error} onRetry={() => void rules.refetch()} />;
      return (
        <GuardrailsView
          guardrails={facts.data.filter((f) => f.section === "guardrail" && f.status === "approved")}
          rules={rules.data}
          onChanged={refresh}
        />
      );
    case "style-guide":
      if (rules.isPending) return <BrandBrainSectionSkeleton />;
      if (rules.isError) return <SectionError error={rules.error} onRetry={() => void rules.refetch()} />;
      return <StyleGuideView rules={rules.data} onChanged={refresh} />;
    case "personas":
      if (personas.isPending) return <BrandBrainSectionSkeleton />;
      if (personas.isError) return <SectionError error={personas.error} onRetry={() => void personas.refetch()} />;
      return <PersonasView personas={personas.data} onChanged={refresh} />;
    case "competitors":
      if (competitors.isPending) return <BrandBrainSectionSkeleton />;
      if (competitors.isError) return <SectionError error={competitors.error} onRetry={() => void competitors.refetch()} />;
      // The summary only decorates the tiles — the list never waits for it.
      return <CompetitorsView competitors={competitors.data} summary={competitorSummary.data} refreshing={competitors.isFetching} onChanged={refresh} />;
  }
}
