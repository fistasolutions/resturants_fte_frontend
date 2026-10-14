/**
 * Spotlight data service (SPEC-109) — server transport. Since SPEC-230 the paths,
 * keys and loaders live in `lib/queries/spotlight.ts` so the client cache refetches
 * the same definitions through `/api/proxy`; this module is their `serverApi` face.
 * Client mutations (generate / approve / request-changes) live in
 * `services/spotlight-actions.ts`.
 */
import { serverApi } from "@/lib/api";
import { spotlightQueries } from "@/lib/queries/spotlight";
import type {
  BlogDraft,
  BlogDraftStatus,
  BrandBrainData,
  DailyPicksHistoryEntry,
  DailyPicksSnapshot,
  JourneyCoverage,
  OverviewData,
  PublishedPost,
  SpotlightQuery,
  VisibilityData,
} from "@/types/spotlight";

export async function getOverview(): Promise<OverviewData> {
  return spotlightQueries.overview().load(serverApi);
}

export async function getBrandBrain(): Promise<BrandBrainData> {
  return spotlightQueries.brandBrain().load(serverApi);
}

export async function getQueries(): Promise<SpotlightQuery[]> {
  return spotlightQueries.queries().load(serverApi);
}

export async function getDailyPicks(): Promise<DailyPicksSnapshot> {
  return spotlightQueries.dailyPicks().load(serverApi);
}

export async function getDailyPicksForDate(date: string): Promise<DailyPicksSnapshot | null> {
  return spotlightQueries.dailyPicksForDate(date).load(serverApi);
}

export async function getDailyPicksHistory(): Promise<DailyPicksHistoryEntry[]> {
  return spotlightQueries.dailyPicksHistory().load(serverApi);
}

export async function getDrafts(status?: BlogDraftStatus): Promise<BlogDraft[]> {
  return spotlightQueries.drafts(status).load(serverApi);
}

export async function getDraft(ref: string | number): Promise<BlogDraft> {
  return spotlightQueries.draft(ref).load(serverApi);
}

export async function getUnpublished(): Promise<PublishedPost[]> {
  return spotlightQueries.unpublished().load(serverApi);
}

export async function getApprovals(): Promise<BlogDraft[]> {
  return spotlightQueries.approvals().load(serverApi);
}

export async function getPublished(): Promise<PublishedPost[]> {
  return spotlightQueries.published().load(serverApi);
}

export async function getJourneyCoverage(): Promise<JourneyCoverage> {
  return spotlightQueries.journeyCoverage().load(serverApi);
}

export async function getVisibility(): Promise<VisibilityData> {
  return spotlightQueries.visibility().load(serverApi);
}
