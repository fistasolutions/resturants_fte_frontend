/**
 * Spotlight queries (SPEC-109 and onward) — the server-side read seam, defined once
 * for both transports (SPEC-230). Client mutations (generate / approve / request
 * changes) stay in `services/spotlight-actions.ts`. Byte-identical paths to the
 * pre-SPEC-230 `services/spotlight.ts`.
 */
import {
  adaptBlogDraft,
  adaptBrandBrain,
  adaptDailyPicksHistoryEntry,
  adaptDailyPicksSnapshot,
  adaptJourneyCoverage,
  adaptOverview,
  adaptPublishedPost,
  adaptSpotlightQuery,
  adaptStrikingDistance,
  adaptVisibility,
  type ApiBlogDraft,
  type ApiBrandBrain,
  type ApiDailyPicksHistoryEntry,
  type ApiDailyPicksSnapshot,
  type ApiJourneyCoverage,
  type ApiOverview,
  type ApiPublishedPost,
  type ApiSpotlightQuery,
  type ApiStrikingDistance,
  type ApiVisibility,
} from "@/lib/adapters";
import { adaptInboundTopics, type ApiInboundTopics } from "@/lib/inbound-topics";
import { adaptRefresh, type ApiRefresh, type RefreshData } from "@/lib/refresh-loop";
import { defineQuery, type ApiGet } from "@/lib/query-def";
import { fromApi } from "@/lib/restaurant-api";
import type { LocalPagesData } from "@/types/local-pages";
import type {
  BlogDraft,
  BlogDraftStatus,
  BrandBrainData,
  DailyPicksHistoryEntry,
  DailyPicksSnapshot,
  InboundTopicsData,
  JourneyCoverage,
  OverviewData,
  PublishedPost,
  SpotlightQuery,
  StrikingDistanceData,
  VisibilityData,
} from "@/types/spotlight";

export const spotlightPaths = {
  inbound: (): string => "/spotlight/inbound",
  overview: (): string => "/spotlight/overview",
  brandBrain: (): string => "/brand-brain",
  queries: (): string => "/spotlight/queries",
  dailyPicks: (): string => "/spotlight/daily-picks",
  dailyPicksForDate: (date: string): string => `/spotlight/daily-picks/${date}`,
  dailyPicksHistory: (): string => "/spotlight/daily-picks/history",
  drafts: (status?: BlogDraftStatus): string =>
    `/spotlight/drafts${status ? `?status=${encodeURIComponent(status)}` : ""}`,
  draft: (ref: string | number): string => `/spotlight/drafts/${encodeURIComponent(String(ref))}`,
  published: (): string => "/spotlight/published",
  /** Backend SPEC-279: every post that was live and isn't. */
  unpublished: (): string => "/spotlight/unpublished",
  refresh: (): string => "/spotlight/refresh",
  attribution: (): string => "/spotlight/attribution",
  visibility: (): string => "/spotlight/visibility",
  /** Backend SPEC-264: the store's page-two opportunities from the latest snapshot. */
  strikingDistance: (limit = 10): string => `/spotlight/striking-distance?limit=${limit}`,
  /** Backend SPEC-403: a restaurant brand's local pages, one per branch. */
  localPages: (): string => "/spotlight/local-pages",
} as const;

export async function loadQueries(api: ApiGet): Promise<SpotlightQuery[]> {
  const { queries } = await api<{ queries: ApiSpotlightQuery[] }>(spotlightPaths.queries());
  return queries.map(adaptSpotlightQuery);
}

/** Today's snapshot — generated on demand by the backend when missing (SPEC-155). */
export async function loadDailyPicks(api: ApiGet): Promise<DailyPicksSnapshot> {
  const { picks } = await api<{ picks: ApiDailyPicksSnapshot }>(spotlightPaths.dailyPicks());
  return adaptDailyPicksSnapshot(picks);
}

/** A past day's snapshot; null on a 404 so the tab can fall back to today. */
export async function loadDailyPicksForDate(api: ApiGet, date: string): Promise<DailyPicksSnapshot | null> {
  try {
    const { picks } = await api<{ picks: ApiDailyPicksSnapshot }>(spotlightPaths.dailyPicksForDate(date));
    return adaptDailyPicksSnapshot(picks);
  } catch {
    return null;
  }
}

export async function loadDrafts(api: ApiGet, status?: BlogDraftStatus): Promise<BlogDraft[]> {
  const { drafts } = await api<{ drafts: ApiBlogDraft[] }>(spotlightPaths.drafts(status));
  return drafts.map(adaptBlogDraft);
}

export const spotlightQueries = {
  /** The Overview rollup (backend SPEC-120). */
  overview: () =>
    defineQuery<OverviewData>(["spotlight", "overview"], async (api) =>
      adaptOverview(await api<ApiOverview>(spotlightPaths.overview())),
    ),
  /** The real, backend-served Brand Brain (SPEC-108). */
  brandBrain: () =>
    defineQuery<BrandBrainData>(["spotlight", "brand-brain"], async (api) =>
      adaptBrandBrain(await api<ApiBrandBrain>(spotlightPaths.brandBrain())),
    ),
  queries: () => defineQuery<SpotlightQuery[]>(["spotlight", "queries"], loadQueries),
  dailyPicks: () => defineQuery<DailyPicksSnapshot>(["spotlight", "daily-picks", "today"], loadDailyPicks),
  dailyPicksForDate: (date: string) =>
    defineQuery<DailyPicksSnapshot | null>(["spotlight", "daily-picks", date], (api) =>
      loadDailyPicksForDate(api, date),
    ),
  dailyPicksHistory: () =>
    defineQuery<DailyPicksHistoryEntry[]>(["spotlight", "daily-picks-history"], async (api) => {
      const { history } = await api<{ history: ApiDailyPicksHistoryEntry[] }>(spotlightPaths.dailyPicksHistory());
      return history.map(adaptDailyPicksHistoryEntry);
    }),
  drafts: (status?: BlogDraftStatus) =>
    defineQuery<BlogDraft[]>(["spotlight", "drafts", status ?? null], (api) => loadDrafts(api, status)),
  /** A single draft incl. grounding + agent trace; `ref` is a slug or a numeric id
   * (backend SPEC-167 resolves both). Throws `ApiError` (404 on an unknown ref). */
  draft: (ref: string | number) =>
    defineQuery<BlogDraft>(["spotlight", "draft", String(ref)], async (api) =>
      adaptBlogDraft(await api<ApiBlogDraft>(spotlightPaths.draft(ref))),
    ),
  /** The query bank as topics (backend SPEC-275 / frontend SPEC-277). */
  inboundTopics: () =>
    defineQuery<InboundTopicsData>(["spotlight", "inbound-topics"], async (api) =>
      adaptInboundTopics(await api<ApiInboundTopics>(spotlightPaths.inbound())),
    ),
  /** The Approvals queue — drafts awaiting review. */
  approvals: () => defineQuery<BlogDraft[]>(["spotlight", "drafts", "in_review"], (api) => loadDrafts(api, "in_review")),
  /** Unpublished posts, newest departure first (backend SPEC-279). */
  unpublished: () =>
    defineQuery<PublishedPost[]>(["spotlight", "unpublished"], async (api) => {
      const { posts } = await api<{ posts: ApiPublishedPost[] }>(spotlightPaths.unpublished());
      return posts.map(adaptPublishedPost);
    }),
  /** Published posts newest-first, each with a `live` reconcile flag (backend SPEC-118). */
  published: () =>
    defineQuery<PublishedPost[]>(["spotlight", "published"], async (api) => {
      const { posts } = await api<{ posts: ApiPublishedPost[] }>(spotlightPaths.published());
      return posts.map(adaptPublishedPost);
    }),
  /** How much of the attribution window has had its customer journey fetched (backend SPEC-197). */
  journeyCoverage: () =>
    defineQuery<JourneyCoverage>(["spotlight", "journey-coverage"], async (api) => {
      const raw = await api<{ journey_coverage?: ApiJourneyCoverage }>(spotlightPaths.attribution());
      return adaptJourneyCoverage(raw.journey_coverage);
    }),
  /** Per published-post Search Console reach (backend SPEC-119) — served from the
   * local `gsc_daily` table, no live Google round trip (root Rule 5). */
  visibility: () =>
    defineQuery<VisibilityData>(["spotlight", "visibility"], async (api) =>
      adaptVisibility(await api<ApiVisibility>(spotlightPaths.visibility())),
    ),
  /** The refresh loop (backend SPEC-302): published posts worth rewriting, richest
   * first, off the rows the Monday scan stored — no live Search Console hop. */
  refresh: () =>
    defineQuery<RefreshData>(["spotlight", "refresh"], async (api) =>
      adaptRefresh(await api<ApiRefresh>(spotlightPaths.refresh())),
    ),
  /** Local pages (frontend SPEC-386 / backend SPEC-403) — a restaurant brand only. */
  localPages: () =>
    defineQuery<LocalPagesData>(["spotlight", "local-pages"], async (api) =>
      fromApi<LocalPagesData>(await api(spotlightPaths.localPages())),
    ),
  /** Striking distance (backend SPEC-264) — local snapshot rows only. */
  strikingDistance: () =>
    defineQuery<StrikingDistanceData>(["spotlight", "striking-distance"], async (api) =>
      adaptStrikingDistance(
        await api<ApiStrikingDistance>(spotlightPaths.strikingDistance()),
      ),
    ),
} as const;
