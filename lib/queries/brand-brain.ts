/**
 * Brand Brain v2 queries (SPEC-263) — the read seam for the eight sub-tabs, defined
 * once for both transports (SPEC-230). Every key starts with `["brand-brain"]` so a
 * write can invalidate the whole family with one prefix. The brain itself
 * (`GET /brand-brain`) stays in `lib/queries/spotlight.ts` as `brandBrain()`.
 */
import {
  adaptBrandBrainEvent,
  adaptBrandRule,
  adaptStyleTest,
  adaptBrandSource,
  adaptCoverage,
  adaptVoice,
  type ApiBrandBrainEvent,
  type ApiBrandRule,
  type ApiStyleTest,
  type ApiBrandSource,
  type ApiCoverage,
  type ApiVoice,
} from "@/lib/brand-brain";
import { adaptBrandFact, adaptBrandPersona, type ApiBrandBrainFact, type ApiBrandPersona } from "@/lib/adapters";
import {
  adaptCompetitor,
  adaptCompetitorSummary,
  type ApiCompetitor,
  type ApiCompetitorSummary,
} from "@/lib/competitors";
import { adaptResearchReview, type ApiResearchReview } from "@/lib/brand-research";
import { defineQuery } from "@/lib/query-def";
import type {
  BrandBrainEvent,
  BrandRule,
  BrandSource,
  Competitor,
  CompetitorSummary,
  StylePrompt,
  StyleSurface,
  StyleTest,
  CoverageData,
  FactDetail,
  SourceDetail,
  VoiceData,
} from "@/types/brand-brain";
import type { ResearchReview } from "@/types/brand-research";
import type { Fact, Persona } from "@/types/spotlight";

export const BRAND_BRAIN_KEY = ["brand-brain"] as const;

export const brandBrainPaths = {
  coverage: (): string => "/brand-brain/coverage",
  sources: (): string => "/brand-brain/sources",
  source: (id: number): string => `/brand-brain/sources/${id}`,
  fact: (id: number): string => `/brand-brain/facts/${id}`,
  sourceFacts: (id: number): string => `/brand-brain/sources/${id}/facts`,
  facts: (): string => "/brand-brain/facts",
  voice: (): string => "/brand-brain/voice",
  rules: (): string => "/brand-brain/rules",
  personas: (): string => "/brand-brain/personas",
  history: (limit = 50): string => `/brand-brain/history?limit=${limit}`,
  /** Backend SPEC-280: competitors, their summary and the run the toast follows. */
  competitors: (): string => "/brand-brain/competitors",
  competitor: (id: number): string => `/brand-brain/competitors/${id}`,
  competitorSummary: (): string => "/brand-brain/competitors/summary",
  competitorActiveRun: (): string => "/brand-brain/competitors/find/active",
  competitorRunEvents: (id: number): string => `/brand-brain/competitors/runs/${id}/events`,
  /** Backend SPEC-292: the prompt an image model is sent, and the test bench. */
  stylePrompt: (surface: string): string => `/brand-brain/style/prompt?surface=${surface}`,
  styleTests: (): string => "/brand-brain/style/tests",
  styleTestImage: (id: number): string => `/brand-brain/style/tests/${id}/image`,
  /** Backend SPEC-347: what the Brand Researcher found that still waits for review. */
  researchReview: (): string => "/brand-brain/research/review",
  researchActive: (): string => "/brand-brain/research/active",
  researchEvents: (id: number): string => `/brand-brain/research/runs/${id}/events`,
} as const;

export const brandBrainQueries = {
  coverage: () =>
    defineQuery<CoverageData>([...BRAND_BRAIN_KEY, "coverage"], async (api) =>
      adaptCoverage(await api<ApiCoverage>(brandBrainPaths.coverage())),
    ),
  sources: () =>
    defineQuery<BrandSource[]>([...BRAND_BRAIN_KEY, "sources"], async (api) =>
      (await api<ApiBrandSource[]>(brandBrainPaths.sources())).map(adaptBrandSource),
    ),
  source: (id: number) =>
    defineQuery<SourceDetail>([...BRAND_BRAIN_KEY, "source", id], async (api) => {
      const raw = await api<{ source: ApiBrandSource; events: ApiBrandBrainEvent[] }>(brandBrainPaths.source(id));
      return { source: adaptBrandSource(raw.source), events: raw.events.map(adaptBrandBrainEvent) };
    }),
  fact: (id: number) =>
    defineQuery<FactDetail>([...BRAND_BRAIN_KEY, "fact", id], async (api) => {
      const raw = await api<{ fact: ApiBrandBrainFact; source: ApiBrandSource | null; events: ApiBrandBrainEvent[] }>(
        brandBrainPaths.fact(id),
      );
      return {
        fact: adaptBrandFact(raw.fact),
        source: raw.source ? adaptBrandSource(raw.source) : null,
        events: raw.events.map(adaptBrandBrainEvent),
      };
    }),
  sourceFacts: (id: number) =>
    defineQuery<Fact[]>([...BRAND_BRAIN_KEY, "source-facts", id], async (api) =>
      (await api<ApiBrandBrainFact[]>(brandBrainPaths.sourceFacts(id))).map(adaptBrandFact),
    ),
  competitors: () =>
    defineQuery<Competitor[]>([...BRAND_BRAIN_KEY, "competitors"], async (api) =>
      (await api<{ competitors: ApiCompetitor[] }>(brandBrainPaths.competitors())).competitors.map(adaptCompetitor),
    ),
  competitor: (id: number) =>
    defineQuery<Competitor>([...BRAND_BRAIN_KEY, "competitor", id], async (api) =>
      adaptCompetitor(await api<ApiCompetitor>(brandBrainPaths.competitor(id))),
    ),
  competitorSummary: () =>
    defineQuery<CompetitorSummary>([...BRAND_BRAIN_KEY, "competitor-summary"], async (api) =>
      adaptCompetitorSummary(await api<ApiCompetitorSummary>(brandBrainPaths.competitorSummary())),
    ),
  facts: () =>
    defineQuery<Fact[]>([...BRAND_BRAIN_KEY, "facts"], async (api) =>
      (await api<ApiBrandBrainFact[]>(brandBrainPaths.facts())).map(adaptBrandFact),
    ),
  voice: () =>
    defineQuery<VoiceData>([...BRAND_BRAIN_KEY, "voice"], async (api) =>
      adaptVoice(await api<ApiVoice>(brandBrainPaths.voice())),
    ),
  rules: () =>
    defineQuery<BrandRule[]>([...BRAND_BRAIN_KEY, "rules"], async (api) =>
      (await api<ApiBrandRule[]>(brandBrainPaths.rules())).map(adaptBrandRule),
    ),
  /** Every persona row — including the ones a file proposed and nobody confirmed (SPEC-267). */
  personas: () =>
    defineQuery<Persona[]>([...BRAND_BRAIN_KEY, "personas"], async (api) =>
      (await api<ApiBrandPersona[]>(brandBrainPaths.personas())).map(adaptBrandPersona),
    ),
  /** What the image model is actually sent (backend SPEC-292) — never a re-rendering. */
  stylePrompt: (surface: StyleSurface) =>
    defineQuery<StylePrompt>([...BRAND_BRAIN_KEY, "style-prompt", surface], async (api) =>
      api<StylePrompt>(brandBrainPaths.stylePrompt(surface)),
    ),
  styleTests: () =>
    defineQuery<StyleTest[]>([...BRAND_BRAIN_KEY, "style-tests"], async (api) =>
      (await api<ApiStyleTest[]>(brandBrainPaths.styleTests())).map(adaptStyleTest),
    ),
  /** Everything research found that still waits for the owner (backend SPEC-347). */
  researchReview: () =>
    defineQuery<ResearchReview>([...BRAND_BRAIN_KEY, "research-review"], async (api) =>
      adaptResearchReview(await api<ApiResearchReview>(brandBrainPaths.researchReview())),
    ),
  history: (limit = 50) =>
    defineQuery<BrandBrainEvent[]>([...BRAND_BRAIN_KEY, "history", limit], async (api) =>
      (await api<ApiBrandBrainEvent[]>(brandBrainPaths.history(limit))).map(adaptBrandBrainEvent),
    ),
};
