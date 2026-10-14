/**
 * Spotlight — pure, unit-testable display logic (SPEC-109). No JSX, no data;
 * shared by the tab bar, the persistent shell, the page route, and the tab
 * components so the tab vocabulary and the SEO-readiness / pipeline scales have
 * exactly one definition.
 */

import { formatNumber } from "@/utils/format";
import type {
  BlogDraftProduct,
  DailyPickScoreParts,
  SpotlightQuery,
} from "@/types/spotlight";

/** The Spotlight tabs, in bar order. `?tab=` values map 1:1 to these. */
export const SPOTLIGHT_TAB_IDS = [
  "overview",
  "chat",
  "brand-brain",
  "inbound",
  "daily-picks",
  "approvals",
  "published",
  "money-pages",
  "visibility",
] as const;

export type SpotlightTab = (typeof SPOTLIGHT_TAB_IDS)[number];

/** Display label per tab (SPEC-163). "Approvals" showed drafts AWAITING a
 * decision (`status = in_review`) but read as "already approved" — the owner
 * read it that way unprompted, which is very likely why a duplicate drafts list
 * ended up on Inbound. Label only: `?tab=approvals` stays valid, because
 * renaming a route to fix a word would break shared links. */
const SPOTLIGHT_TAB_LABELS: Record<SpotlightTab, string> = {
  overview: "Overview",
  chat: "Chat",
  "brand-brain": "Brand Brain",
  inbound: "Inbound Engine",
  "daily-picks": "Daily Picks",
  approvals: "Needs review",
  published: "Published",
  "money-pages": "Money pages",
  visibility: "Visibility",
};

export function spotlightTabLabel(tab: SpotlightTab): string {
  return SPOTLIGHT_TAB_LABELS[tab];
}

/** The "Today" option's value (SPEC-163 Patch).
 *
 * NOT the empty string: Radix `Select` treats `""` as "nothing selected", so an
 * option with an empty value renders as a blank trigger — which is exactly how
 * this shipped. A real sentinel is mapped back to "no `?date=` param" by the
 * caller. */
export const DAILY_PICKS_TODAY_VALUE = "today";

/** One entry in the Daily Picks date dropdown (SPEC-163). */
export interface DailyPicksDateOption {
  /** `DAILY_PICKS_TODAY_VALUE` for today; otherwise a YYYY-MM-DD date. */
  value: string;
  label: string;
}

/** "Today" plus every dated snapshot, newest first (SPEC-163).
 *
 * Replaces a pill strip that grew by one every day and was already unusable at a
 * month. Today is listed once even when it already has a snapshot, so the list
 * never shows the same day twice under two names. */
export function dailyPicksDateOptions(
  history: { pickDate: string }[],
  todayDate: string,
): DailyPicksDateOption[] {
  // Deduped defensively: the DB guarantees one snapshot per store per day, but a
  // repeated value here would mean duplicate React keys and a Select that cannot
  // resolve its own selection.
  const past = [
    ...new Set(
      history
        .map((entry) => entry.pickDate)
        .filter((date) => date && date !== todayDate),
    ),
  ].sort((a, b) => b.localeCompare(a));
  return [
    { value: DAILY_PICKS_TODAY_VALUE, label: "Today" },
    ...past.map((date) => ({ value: date, label: date })),
  ];
}

/** Coerce an untrusted `?tab=` value to a real tab; unknown → "overview". */
export function normalizeSpotlightTab(value: string | null | undefined): SpotlightTab {
  return SPOTLIGHT_TAB_IDS.includes(value as SpotlightTab)
    ? (value as SpotlightTab)
    : "overview";
}

export type SeoTone = "strong" | "fair" | "weak";

/** SEO-readiness score (0–100) → tone bucket. ≥80 strong, ≥60 fair, else weak. */
export function seoTone(score: number): SeoTone {
  if (score >= 80) return "strong";
  if (score >= 60) return "fair";
  return "weak";
}

/** Human label for the SEO tone bucket. */
export function seoToneLabel(score: number): string {
  const tone = seoTone(score);
  return tone === "strong" ? "Strong" : tone === "fair" ? "Fair" : "Needs work";
}

/* ── Quality harness scorecard (backend SPEC-121) ─────────────────────────── */

/** One scored dimension of a draft, its short label, and what it optimizes for.
 * `key` matches the backend `QualityDimensionScores` fields. */
export const QUALITY_DIMENSIONS = [
  { key: "seo", label: "SEO", caption: "Search" },
  { key: "aeo", label: "AEO", caption: "Answer engines" },
  { key: "geo", label: "GEO", caption: "Generative / LLMs" },
  { key: "quality", label: "Quality", caption: "Brand" },
] as const;

export type QualityDimensionKey = (typeof QUALITY_DIMENSIONS)[number]["key"];

/** The four persisted draft scores, any of which may be null before the harness
 * ran (SEO is always present). */
export interface DraftQualityScores {
  seo: number;
  aeo: number | null;
  geo: number | null;
  quality: number | null;
}

/** A single overall readout for the scorecard header: the rounded mean of the
 * dimensions the backend actually scored (nulls excluded, never counted as 0).
 * SEO is always present, so this never divides by zero. */
export function overallQualityScore(scores: DraftQualityScores): number {
  const present = [scores.seo, scores.aeo, scores.geo, scores.quality].filter(
    (value): value is number => value !== null,
  );
  return Math.round(present.reduce((sum, value) => sum + value, 0) / present.length);
}

/** True once the quality harness has scored a draft on every dimension (so the
 * full four-dial scorecard, not just SEO, is meaningful). */
export function hasFullQualityScores(scores: DraftQualityScores): boolean {
  return scores.aeo !== null && scores.geo !== null && scores.quality !== null;
}

/** Estimated read time in whole minutes from a word count (~200 wpm), floored
 * at 1 so even a short draft never reads "0 min". */
export function draftReadMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

/** Query-bank intent → display label. Backend emits `high | seasonal |
 * informational` today; any other value is title-cased so a new backend intent
 * still renders sensibly instead of breaking. */
export function queryIntentLabel(intent: string): string {
  const known: Record<string, string> = {
    high: "High intent",
    seasonal: "Seasonal",
    informational: "Informational",
    comparison: "Comparison",
    commercial: "Commercial",
    transactional: "Transactional",
    navigational: "Navigational",
  };
  if (known[intent]) return known[intent];
  const cleaned = intent.replace(/[_-]+/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "—";
}

/** The intents a search-intent template may carry (backend SPEC-156), in display
 * order. Matches the backend `ALLOWED_INTENTS`; `queryIntentLabel` renders each. */
export const INTENT_TEMPLATE_INTENTS = [
  "high",
  "seasonal",
  "informational",
  "comparison",
] as const;

export type IntentTemplateIntent = (typeof INTENT_TEMPLATE_INTENTS)[number];

/** A search-intent template needs the `{category}` placeholder — the query bank
 * slots each real category into it. Pure, unit-tested; the editor gates "Save" on it. */
export function intentTemplateHasPlaceholder(template: string): boolean {
  return template.includes("{category}");
}

/* ── Daily Picks (backend SPEC-155) ───────────────────────────────────────── */

/** A backend opportunity score (0–1) as a rounded whole-percent display value.
 * Display-only — the backend owns the ranking (root Rule 8). Out-of-range inputs
 * are clamped so a malformed value never renders a nonsense width or label. */
export function formatPickScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.round(Math.max(0, Math.min(score, 1)) * 100);
}

/** The figure a card leads with (SPEC-164 Patches): the topic's own fit when the
 * backend sent it, else the ranking score — so a rotation-halved rank never reads
 * as a bad topic. */
export function pickHeadlineScore(pick: { score: number; scoreParts: { fit?: number } }): number {
  return formatPickScore(typeof pick.scoreParts.fit === "number" ? pick.scoreParts.fit : pick.score);
}

/** "Ranked lower today — written 3 days ago" from the freshness multiplier, which
 * recovers linearly from 0.5 (today) to 1 (30 days). Null when no penalty. */
export function pickRotationNote(freshness: number, cooldownDays = 30): string | null {
  if (!(freshness < 1)) return null;
  const days = Math.round(((Math.max(0.5, freshness) - 0.5) / 0.5) * cooldownDays);
  return days <= 0 ? "Ranked lower today — written today" : `Ranked lower today — written ${days} ${days === 1 ? "day" : "days"} ago`;
}

/** The backend score components, in display order, with their labels — the
 * single source of truth for the score breakdown UI. `key` matches
 * `DailyPickScoreParts`. `striking` (backend SPEC-264) is optional on the parts and
 * is drawn only when the backend measured it. */
export const DAILY_PICK_SCORE_PARTS = [
  { key: "demand", label: "Demand" },
  { key: "striking", label: "Striking distance" },
  { key: "margin", label: "Margin" },
  { key: "catalog", label: "Catalog" },
  { key: "brandFit", label: "Brand fit" },
] as const;

/** True when the backend scored this pick with striking distance measured. */
export function hasStrikingPart(parts: DailyPickScoreParts): boolean {
  return typeof parts.striking === "number";
}

/** The evidence line under a pick's bars (SPEC-265): *you rank #12 for "black
 * maxi skirt" — 6,522 searches saw it in 28 days*. Null when there is none. */
export function formatStrikingEvidence(
  striking: { query: string; position: number; impressions: number } | null,
): string | null {
  if (!striking || !striking.query) return null;
  const position = Number.isInteger(striking.position)
    ? String(striking.position)
    : striking.position.toFixed(1);
  const impressions = striking.impressions.toLocaleString("en-US");
  return `You rank #${position} for "${striking.query}" — ${impressions} searches saw it in 28 days`;
}

/** The URL for a draft (SPEC-165).
 *
 * Prefers the readable slug over the database id. Older rows may have no handle,
 * so the id remains the fallback — and backend SPEC-167 resolves BOTH from one
 * endpoint, so every previously shared `/draft/15` link keeps working rather
 * than 404ing. A nicer URL that breaks bookmarks is not an improvement. */
export function draftHref(draft: { id: number; handle?: string | null }): string {
  const slug = draft.handle?.trim();
  return `/spotlight/draft/${slug || draft.id}`;
}

/* ── Why did this pick rank here? (SPEC-164) ──────────────────────────────── */

/** The backend's scoring weights, mirrored for EXPLANATION only — never to
 * recompute a score (root Rule 8: the backend owns every number). They must stay
 * in step with `daily_picks_scorer.py`; a drift changes only which component gets
 * named as the driver, never the rank itself. */
type WeightedPart = keyof Omit<DailyPickScoreParts, "freshness" | "performance" | "fit">;

/** The legacy four weights, in force when striking distance is unmeasured. */
const LEGACY_WEIGHTS: Record<Exclude<WeightedPart, "striking">, number> = {
  demand: 0.4,
  margin: 0.25,
  catalog: 0.2,
  brandFit: 0.15,
};

/** The five weights once striking distance is measured (backend SPEC-264). */
const MEASURED_WEIGHTS: Record<WeightedPart, number> = {
  demand: 0.3,
  striking: 0.2,
  margin: 0.2,
  catalog: 0.15,
  brandFit: 0.15,
};

/** The weight set the backend used for these parts — decided the same way the
 * backend decides it: by whether `striking` was measured. */
export function scoreWeightsFor(parts: DailyPickScoreParts): Partial<Record<WeightedPart, number>> {
  return hasStrikingPart(parts) ? MEASURED_WEIGHTS : LEGACY_WEIGHTS;
}

const DRIVER_COPY: Record<WeightedPart, string> = {
  demand: "shoppers search for this more than anything else in your catalog",
  striking: "you already rank on page two for a search here — one focused post moves it to page one",
  margin: "this category earns more per sale than most",
  catalog: "you have plenty of products to feature here",
  brandFit: "it speaks directly to one of your real customer personas",
};

const LIMITER_COPY: Record<WeightedPart, string> = {
  demand: "search demand here is low, so expect a slower burn",
  striking: "nothing you already rank for is within reach here yet",
  margin: "margin in this category is thin, so traffic matters more than volume",
  catalog: "you have few products to link to — worth adding some before you write",
  brandFit: "the persona fit is weaker than your strongest topics",
};

/** Three lines explaining a pick's rank, COMPUTED from the score it already
 * carries (SPEC-164).
 *
 * Deliberately not LLM-generated: the score is a known formula over values
 * already on the card, so the reason is derivable — instant, free, identical on
 * every open, and incapable of inventing a justification the numbers do not
 * support. */
export function pickRankExplanation(
  parts: DailyPickScoreParts,
  rank: number,
  source: string,
  striking: { query: string; position: number; impressions: number } | null = null,
): string[] {
  const weights = scoreWeightsFor(parts);
  const keys = Object.keys(weights) as WeightedPart[];
  const weight = (key: WeightedPart): number => weights[key] ?? 0;

  // Driver = biggest weighted CONTRIBUTION, not the tallest bar. Brand fit at
  // 1.0 contributes 0.15; demand at 0.8 contributes 0.32 — ranking by the raw
  // bar would credit the wrong signal.
  const driver = keys.reduce((best, key) =>
    weight(key) * (parts[key] ?? 0) > weight(best) * (parts[best] ?? 0) ? key : best,
  );
  // Limiter = biggest weighted SHORTFALL: where this pick lost the most ground.
  // This is the actionable line.
  const limiter = keys.reduce((worst, key) =>
    weight(key) * (1 - (parts[key] ?? 0)) > weight(worst) * (1 - (parts[worst] ?? 0))
      ? key
      : worst,
  );

  const lead = rank === 1 ? "Today's top pick" : `Ranked #${rank}`;
  const lines = [
    `${lead} — ${DRIVER_COPY[driver]}.`,
    `Held back by: ${LIMITER_COPY[limiter]}.`,
  ];

  // The one thing the bars cannot show. Priority order, most informative first.
  const evidence = formatStrikingEvidence(striking);
  if (evidence) {
    lines.push(`Why now: ${evidence.charAt(0).toLowerCase()}${evidence.slice(1)} — page one is one good post away.`);
  } else if ((parts.performance ?? 1) > 1) {
    lines.push("Why now: what you've already published on this topic is earning clicks.");
  } else if ((parts.freshness ?? 1) < 1) {
    lines.push("Why now: you covered this recently, so it ranks lower today than it will later.");
  } else if (source === "researched") {
    lines.push("Why now: newly found by research — you have no coverage here yet.");
  } else if (source === "competitor_gap") {
    lines.push("Why now: a competitor publishes on this and you don't — a gap on page one.");
  } else {
    lines.push("Why now: you haven't covered this in the last 30 days.");
  }
  return lines;
}

/* ── Daily Pick provenance (SPEC-159) ─────────────────────────────────────── */

/** A pick's source → the label shown on its chip. `search_console` is real
 * measured Google demand; `researched` is the discovery agent's unproven find;
 * `derived` is generated from the store's own catalog. An unknown source
 * title-cases rather than throwing, so a new backend source still renders. */
export function pickSourceLabel(source: string, sourceRef: string | null = null): string {
  if (source === "search_console") return "Measured";
  if (source === "researched") return "Research";
  // SPEC-292: a topic an approved competitor publishes that the store does not.
  if (source === "competitor_gap") return sourceRef ? `Competitor gap · ${sourceRef}` : "Competitor gap";
  if (source === "derived") return "Suggested";
  const cleaned = source.replace(/[_-]+/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "Suggested";
}

/** Token-only chip treatment per source (root Rule 9 — no hardcoded colors).
 * `measured` gets the success tint so real data reads as trustworthy at a
 * glance; a research guess deliberately stays muted so it can never be
 * mistaken for a measurement. */
export function pickSourceTone(source: string): string {
  if (source === "search_console") return "bg-success/10 text-success";
  if (source === "researched") return "bg-muted text-foreground";
  if (source === "competitor_gap") return "bg-ai/10 text-ai";
  return "bg-muted text-muted-foreground";
}

/** True when this pick came from the discovery lane — a scout find or a competitor
 * gap (SPEC-292) — the caller uses it to show the discovery icon (SPEC-159). */
export function isResearchedPick(source: string): boolean {
  return source === "researched" || source === "competitor_gap";
}

/** Plain-language notes explaining a rank the score bars can't (SPEC-161).
 * `freshness` and `performance` are MULTIPLIERS, never 0–1 components, so they
 * are worded rather than drawn as bars. Returns [] when both are neutral, so a
 * normal card stays quiet. */
export function pickModifierNotes(parts: {
  freshness: number;
  performance: number;
}): string[] {
  const notes: string[] = [];
  const rotation = pickRotationNote(parts.freshness);
  if (rotation) notes.push(rotation);
  if (parts.performance > 1) notes.push("This topic performs well");
  else if (parts.performance < 1) notes.push("This topic hasn't earned clicks yet");
  return notes;
}

/** Query-bank source → display label (backend SPEC-125). `search_console` is
 * real measured demand; `derived` is a template/attribute suggestion. Any other
 * value is title-cased so a new backend source still renders sensibly. */
export function querySourceLabel(source: string): string {
  if (source === "search_console") return "Search Console";
  if (source === "derived") return "Suggested";
  // Explicit rather than falling through to the title-case default (SPEC-161):
  // this must read the same word as the Daily Picks chip, or "Research" means
  // two different things on two tabs.
  if (source === "researched") return "Research";
  if (source === "competitor_gap") return "Competitor gap";
  const cleaned = source.replace(/[_-]+/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "—";
}

/** One topic group of the query bank: its cluster key, a display heading, and
 * the queries in it. `cluster` is "" for the ungrouped bucket. */
export interface QueryCluster {
  cluster: string;
  label: string;
  queries: SpotlightQuery[];
}

const OTHER_CLUSTER = "__other__";

/** Title-case a cluster key ("linen skirts" → "Linen Skirts"). */
function clusterHeading(cluster: string): string {
  return cluster
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Group the flat query bank by `cluster`/topic (backend SPEC-125 returns flat
 * rows carrying `cluster`; the UI groups). First-seen cluster order is
 * preserved; queries with no cluster fall into a single "Other searches" bucket
 * placed last. Pure — unit-tested, no data fetching.
 */
export function groupQueriesByCluster(queries: SpotlightQuery[]): QueryCluster[] {
  const groups = new Map<string, SpotlightQuery[]>();
  for (const query of queries) {
    // A discovered keyword owns its cluster (backend SPEC-163), so grouping by
    // cluster alone would give one single-row group per discovery. Group by the
    // real parent category when there is one; the row keeps its own "Research"
    // chip either way.
    const raw = query.parentCategory?.trim() || query.cluster?.trim() || "";
    const key = raw ? raw : OTHER_CLUSTER;
    const bucket = groups.get(key);
    if (bucket) bucket.push(query);
    else groups.set(key, [query]);
  }
  return [...groups.entries()]
    .sort((a, b) => {
      if (a[0] === b[0]) return 0;
      if (a[0] === OTHER_CLUSTER) return 1;
      if (b[0] === OTHER_CLUSTER) return -1;
      return 0;
    })
    .map(([key, groupQueries]) => ({
      cluster: key === OTHER_CLUSTER ? "" : key,
      label: key === OTHER_CLUSTER ? "Other searches" : clusterHeading(key),
      queries: groupQueries,
    }));
}

/** Partition the bank into "what matters today" and everything else (SPEC-161).
 *
 * `focusClusters` comes from TODAY'S picks, so this is a second VIEW of the
 * existing ranking, never a second ranking — the two surfaces cannot disagree.
 * Focus rows come back in pick order so the priority reads top-down. The
 * partition is total: every input query lands in exactly one side. */
export function splitTodaysFocus(
  queries: SpotlightQuery[],
  focusClusters: string[],
): { focus: SpotlightQuery[]; rest: SpotlightQuery[] } {
  const order = new Map<string, number>();
  focusClusters.forEach((cluster, index) => {
    const key = cluster.trim().toLowerCase();
    if (key && !order.has(key)) order.set(key, index);
  });
  if (order.size === 0) return { focus: [], rest: queries };

  const focus: { query: SpotlightQuery; rank: number }[] = [];
  const rest: SpotlightQuery[] = [];
  for (const query of queries) {
    const key = query.cluster?.trim().toLowerCase() ?? "";
    const rank = key ? order.get(key) : undefined;
    if (rank === undefined) rest.push(query);
    else focus.push({ query, rank });
  }
  focus.sort((a, b) => a.rank - b.rank);
  return { focus: focus.map((f) => f.query), rest };
}

/** Count line for the bank BELOW the focus panel (SPEC-162).
 *
 * The shipped panel showed "4 of 300" directly above "300 of 300 searches" — two
 * different denominators with no explanation, which reads as a bug even though
 * both were individually correct. The bank now counts only what it actually
 * shows, so panel + bank sum to the whole. */
export function bankCountLabel(shown: number, total: number): string {
  if (shown === total) {
    return `${total} more ${total === 1 ? "search" : "searches"}`;
  }
  return `${shown} of ${total}`;
}

/** Active filter state for the Query bank (frontend SPEC-127). `"all"` on
 * `intent`/`source` means "don't filter that dimension". */
export interface QueryFilters {
  search: string;
  intent: string;
  source: string;
}

/** Filter the flat query bank (frontend SPEC-127) — pure, unit-tested, applied
 * BEFORE `groupQueriesByCluster`. Search is a case-insensitive, trimmed substring
 * match on the keyword; `intent`/`source` match exactly unless set to the sentinel
 * `"all"`. Input order is preserved (grouping happens after). */
export function filterQueries(
  queries: SpotlightQuery[],
  { search, intent, source }: QueryFilters,
): SpotlightQuery[] {
  const needle = search.trim().toLowerCase();
  return queries.filter((query) => {
    if (needle && !query.keyword.toLowerCase().includes(needle)) return false;
    if (intent !== "all" && query.intent !== intent) return false;
    if (source !== "all" && query.source !== source) return false;
    return true;
  });
}

/** The distinct intents and sources present in the bank, in first-seen order, so
 * the filter Selects only offer values that actually exist (a new backend intent/
 * source still appears). Pure — unit-tested. */
export function queryFilterOptions(queries: SpotlightQuery[]): {
  intents: string[];
  sources: string[];
} {
  const intents: string[] = [];
  const sources: string[] = [];
  for (const query of queries) {
    if (query.intent && !intents.includes(query.intent)) intents.push(query.intent);
    if (query.source && !sources.includes(query.source)) sources.push(query.source);
  }
  return { intents, sources };
}

/** Draft status → chip label (review + publish vocabulary, backend SPEC-118). */
export function draftStatusLabel(status: string): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes requested";
    case "published":
      return "Published";
    case "unpublished":
      return "Unpublished";
    case "draft":
      return "Draft";
    default:
      return "In review";
  }
}

/** Request an already-sized image from Shopify's CDN via its `width` query
 * param, so the browser fetches a right-sized asset instead of the full-res
 * original (Rule 5 — mirrors the dashboard top-products thumbnail helper).
 * Non-Shopify or unparseable URLs pass through unchanged. */
export function shopifyImageUrl(url: string, width: number): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

/* ── Blog hero image resolution (SPEC-153 patch) ──────────────────────────── */

/** The resolved background for {@link BlogHero}: the served art-directed hero when
 * present, else the featured product photo (width-sized), else nothing. */
export interface HeroImageResolution {
  /** CSS `background-image` URL to paint, or `null` when there is no image at all. */
  backgroundImage: string | null;
  /** True when the served art-directed hero (not the product photo) is being painted. */
  showHero: boolean;
  /** True when there is ANY real image — `false` means render the compact placeholder
   * (a short prompt band) instead of a giant empty gradient. */
  hasImage: boolean;
}

/**
 * Resolve which image the L5 hero paints, in one place (SPEC-153 patch). Order:
 * the served art-directed hero (`heroUrl`, unless it failed to load) → the featured
 * product photo (`imageUrl`, requested at a display width) → none. When neither
 * exists, `backgroundImage` is `null` and `hasImage` is `false`, so the hero renders
 * a compact placeholder rather than a tall empty band. Pure — unit-tested.
 */
export function resolveHeroImage(
  heroUrl: string | null | undefined,
  heroFailed: boolean,
  imageUrl: string | null,
): HeroImageResolution {
  const showHero = Boolean(heroUrl) && !heroFailed;
  const backgroundImage = showHero
    ? (heroUrl as string)
    : imageUrl
      ? shopifyImageUrl(imageUrl, 2000)
      : null;
  return { backgroundImage, showHero, hasImage: backgroundImage !== null };
}

/* ── Rich blog: anchor ids + JSON-LD (backend SPEC-124) ───────────────────── */

/** Slugify an `## H2` heading into a URL-safe anchor id — the SAME transform the
 * backend `table_of_contents` uses (`derive.slugify`), so the id the body
 * renderer stamps on a heading matches the id in the draft's `toc`. Empty →
 * "section" so a heading is never left anchorless. */
export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

/** De-duplicate a heading slug against the ones already seen in this render,
 * mirroring the backend's `-1`/`-2` suffixing so repeated headings still line up
 * with their `toc` entries. Mutates `counts` (call with a fresh Map per render). */
export function uniqueHeadingId(text: string, counts: Map<string, number>): string {
  const base = slugifyHeading(text);
  const seen = counts.get(base);
  if (seen === undefined) {
    counts.set(base, 0);
    return base;
  }
  counts.set(base, seen + 1);
  return `${base}-${seen + 1}`;
}

const _H2_LINE_RE = /^\s*##\s+(.+?)\s*$/;
const _FAQ_HEADING_RE = /faq|frequently asked/i;

/* ── Deterministic in-body rendering keyed off source line (SPEC-126) ─────────
 * The blog body renderer used render-time mutable counters (a paragraph index +
 * a per-render heading-count Map) to decide the drop-cap and heading ids. React
 * can call the custom element renderers in a different order/count during client
 * hydration than during SSR, so those counters diverged → a hydration mismatch.
 * These pure helpers compute the same decisions once from the `content` string,
 * keyed by the 1-based source line number — which is stable across SSR + client
 * because react-markdown passes each node's `position.start.line`. */

/** Map every `## H2` heading's 1-based source line number to the anchor id it
 * should carry. Ids come from {@link uniqueHeadingId} fed a single fresh Map, so
 * the `-1`/`-2` dedup mirrors the backend `table_of_contents` and lines up with
 * `draft.toc`. Headings are scanned in document order (dedup depends on order). */
export function headingIdsByLine(content: string): Map<number, string> {
  const ids = new Map<number, string>();
  const counts = new Map<string, number>();
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(_H2_LINE_RE);
    if (match) ids.set(i + 1, uniqueHeadingId(match[1].trim(), counts));
  }
  return ids;
}

const _HEADING_LINE_RE = /^\s*#{1,6}\s+/;
const _LIST_ITEM_RE = /^\s*(?:[-*+]|\d+[.)])\s+/;
const _BLOCKQUOTE_LINE_RE = /^\s*>/;
const _HR_LINE_RE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const _CODE_FENCE_RE = /^\s*(?:```|~~~)/;
const _TABLE_ROW_RE = /^\s*\|/;

/** 1-based line number of the first "paragraph" line — the first non-blank line
 * that is NOT a heading, list item, blockquote, thematic break (hr), code fence,
 * or table row. `null` when the body has no such line. Used to place the drop-cap
 * on exactly the first body paragraph, deterministically. */
export function firstParagraphLineNumber(content: string): number | null {
  const lines = content.split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (_CODE_FENCE_RE.test(line)) {
      // A fence line toggles the fenced-code block; neither the fence nor the
      // lines inside it are a paragraph.
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (line.trim() === "") continue;
    if (_HEADING_LINE_RE.test(line)) continue;
    if (_HR_LINE_RE.test(line)) continue;
    if (_LIST_ITEM_RE.test(line)) continue;
    if (_BLOCKQUOTE_LINE_RE.test(line)) continue;
    if (_TABLE_ROW_RE.test(line)) continue;
    return i + 1;
  }
  return null;
}

/** True for an absolute outbound `http(s)` URL; false for relative paths
 * (`/products/…`), in-page anchors (`#…`), other schemes, and empty. The body
 * renderer uses this to render outbound links as plain muted citations rather
 * than clickable links (SPEC-126 — complements the backend link-stripping). */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test((href ?? "").trim());
}

/** Split the FAQ section out of the body Markdown (backend SPEC-124). The backend
 * keeps the FAQ prose in `body_md` (it must render visibly on Shopify), but in-app
 * the FAQ is shown as an interactive accordion from `draft.faq` — so the section is
 * removed from the prose here to avoid rendering it twice. Returns the body without
 * the FAQ section and the slug id of the FAQ heading (matching the `toc` id, so a
 * TOC link still jumps to the accordion). No FAQ heading → body unchanged, id null.
 * Mirrors the backend `_faq_section_lines` scan (FAQ H2 → next H2 / EOF). */
export function splitBodyFaq(bodyMd: string): {
  body: string;
  faqHeadingId: string | null;
} {
  const lines = bodyMd.split("\n");
  let start = -1;
  let headingText = "";
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(_H2_LINE_RE);
    if (match && _FAQ_HEADING_RE.test(match[1])) {
      start = i;
      headingText = match[1].trim();
      break;
    }
  }
  if (start === -1) return { body: bodyMd, faqHeadingId: null };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (_H2_LINE_RE.test(lines[i])) {
      end = i;
      break;
    }
  }
  const kept = [...lines.slice(0, start), ...lines.slice(end)];
  return { body: kept.join("\n").trim(), faqHeadingId: slugifyHeading(headingText) };
}

/** Serialize schema.org JSON-LD objects for a `<script type="application/ld+json">`,
 * scrubbing `<` to its unicode escape so a value can never break out of the
 * script element (Next 16 JSON-LD guide). Empty payload → empty string. */
export function jsonLdScriptContent(jsonLd: unknown[]): string {
  if (!jsonLd || jsonLd.length === 0) return "";
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

/* ── Premium magazine layout: sections + interleaved galleries (SPEC-150) ────
 * Pure, unit-tested planning for the editorial blog-detail reading experience.
 * The body is split at each `## H2` into an intro + sections, and the draft's
 * real grounded product images are woven between those sections as image bands so
 * prose and photography alternate like a magazine — never a flat text wall. No
 * JSX, no data fetching; the component layer renders what these return. */

/** One `## H2` article section: the slug anchor `id` (matching `draft.toc` and
 * {@link headingIdsByLine}), the heading text, and the section `body` Markdown —
 * which INCLUDES the `## heading` line so {@link BlogMarkdown} renders it. */
export interface BlogSection {
  id: string;
  heading: string;
  body: string;
}

/** The body split for the editorial layout: the prose before the first `## H2`
 * (the drop-cap intro) and the ordered `## H2` sections after it. */
export interface BlogBodyParts {
  intro: string;
  sections: BlogSection[];
}

/** One item in the interleaved reading flow: an article section, or an editorial
 * image band woven between sections. */
export type BlogFlowItem =
  | { kind: "section"; section: BlogSection }
  | { kind: "gallery"; products: BlogDraftProduct[] };

/** Tuning for {@link planBlogGalleries}. `maxPerGallery` caps the images in one
 * band; `maxGalleries` caps how many bands are woven in. */
export interface GalleryPlanOptions {
  maxPerGallery?: number;
  maxGalleries?: number;
}

/**
 * Split the reading body (with the FAQ already lifted out by {@link splitBodyFaq})
 * into the drop-cap intro and the ordered `## H2` sections. Each section carries a
 * slug anchor id computed with the SAME `uniqueHeadingId` dedup, in document
 * order, as {@link headingIdsByLine} and the backend `table_of_contents` — so a
 * TOC link still jumps to the right heading even though sections render
 * independently. A body with no `## H2` is returned entirely as `intro`.
 */
export function splitBodyIntoSections(body: string): BlogBodyParts {
  const lines = body.split("\n");
  const headingLines: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (_H2_LINE_RE.test(lines[i])) headingLines.push(i);
  }
  if (headingLines.length === 0) {
    return { intro: body.trim(), sections: [] };
  }
  const intro = lines.slice(0, headingLines[0]).join("\n").trim();
  const counts = new Map<string, number>();
  const sections: BlogSection[] = [];
  for (let h = 0; h < headingLines.length; h += 1) {
    const start = headingLines[h];
    const end = h + 1 < headingLines.length ? headingLines[h + 1] : lines.length;
    const match = lines[start].match(_H2_LINE_RE);
    const heading = match ? match[1].trim() : "";
    sections.push({
      id: uniqueHeadingId(heading, counts),
      heading,
      body: lines.slice(start, end).join("\n").trim(),
    });
  }
  return { intro, sections };
}

/** Split `items` into exactly `groups` contiguous, as-even-as-possible chunks
 * (larger chunks first). `groups` is clamped to `[1, items.length]` so no empty
 * chunk is ever produced. */
function splitEvenly<T>(items: T[], groups: number): T[][] {
  const total = items.length;
  const g = Math.max(1, Math.min(groups, total));
  const base = Math.floor(total / g);
  const remainder = total % g;
  const out: T[][] = [];
  let cursor = 0;
  for (let i = 0; i < g; i += 1) {
    const size = base + (i < remainder ? 1 : 0);
    out.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return out;
}

/**
 * Plan the interleave of article sections and editorial image bands. Only
 * products WITH an image become gallery items (never fabricated; Rule 8). They
 * are split into `groups = clamp(ceil(imaged / maxPerGallery), 1,
 * min(maxGalleries, max(1, sectionCount)))` bands, each woven in BEFORE an
 * evenly-spread section index so prose and photography alternate
 * (`intro → [gallery] → section → section → [gallery] → …`). Every band is placed
 * and every section preserved in document order. Degrades gracefully: no images →
 * the sections unchanged (no bands); no sections but images exist → the bands
 * alone (they follow the whole-body intro). Pure — unit-tested.
 */
export function planBlogGalleries(
  sections: BlogSection[],
  products: BlogDraftProduct[],
  options: GalleryPlanOptions = {},
): BlogFlowItem[] {
  const maxPerGallery = options.maxPerGallery ?? 3;
  const maxGalleries = options.maxGalleries ?? 3;
  const imaged = products.filter((product) => Boolean(product.imageUrl));

  const sectionItems: BlogFlowItem[] = sections.map((section) => ({
    kind: "section",
    section,
  }));
  if (imaged.length === 0) return sectionItems;

  const byCapacity = Math.ceil(imaged.length / Math.max(1, maxPerGallery));
  const groups = Math.max(
    1,
    Math.min(byCapacity, maxGalleries, Math.max(1, sections.length)),
  );
  const bands = splitEvenly(imaged, groups);

  // No H2 sections at all — the whole body is the intro; emit the bands after it.
  if (sections.length === 0) {
    return bands.map((band) => ({ kind: "gallery", products: band }));
  }

  // Distinct section indices (spread evenly) to place a band BEFORE.
  const slots = new Set<number>();
  for (let i = 0; i < bands.length; i += 1) {
    let slot = Math.round((i * sections.length) / bands.length);
    if (slot >= sections.length) slot = sections.length - 1;
    while (slots.has(slot) && slot < sections.length - 1) slot += 1;
    slots.add(slot);
  }

  const flow: BlogFlowItem[] = [];
  let bandIdx = 0;
  for (let si = 0; si < sections.length; si += 1) {
    if (slots.has(si) && bandIdx < bands.length) {
      flow.push({ kind: "gallery", products: bands[bandIdx] });
      bandIdx += 1;
    }
    flow.push({ kind: "section", section: sections[si] });
  }
  // Safety net: place any band a slot collision left behind (never lose images).
  while (bandIdx < bands.length) {
    flow.push({ kind: "gallery", products: bands[bandIdx] });
    bandIdx += 1;
  }
  return flow;
}

/* ── Minimal-Luxury (L5) reading flow: sections, galleries + one split (SPEC-153) ─
 * The owner-approved "Minimal Luxury" layout keeps the SPEC-150 section/gallery
 * interleave but promotes ONE section into a magazine "split" — a grounded
 * product image beside a text pane. Pure, unit-tested planning; the component
 * layer renders what this returns. */

/** One item in the L5 reading flow: an article section, a full-width editorial
 * image band, or the magazine split (a product image beside a section's prose). */
export type L5FlowItem =
  | { kind: "section"; section: BlogSection }
  | { kind: "gallery"; products: BlogDraftProduct[] }
  | { kind: "split"; section: BlogSection; product: BlogDraftProduct };

/**
 * Plan the Minimal-Luxury reading flow (SPEC-153). Reuses
 * {@link planBlogGalleries} for the section/gallery interleave, then reserves ONE
 * mid-body section + ONE grounded image (the LAST imaged product, so the earlier
 * images — including the hero product — stay available for the galleries) to
 * render as the L5 image/text split, re-woven into its original document
 * position (keyed by the preceding section's slug id).
 *
 * Degrades gracefully (Rule 6): no images OR no sections → the plain
 * section/gallery flow with no split; one image → the split alone (no galleries);
 * with sections + images every section is represented exactly once (as a
 * `section` OR the `split`'s section — never both) and every imaged product is
 * placed exactly once (across galleries + the split — never lost, never
 * duplicated). Pure — unit-tested.
 */
export function planL5Flow(
  sections: BlogSection[],
  products: BlogDraftProduct[],
  options: GalleryPlanOptions = {},
): L5FlowItem[] {
  const imaged = products.filter((product) => Boolean(product.imageUrl));

  // No image to pair, or no section to fill the pane → no split; fall back to the
  // section/gallery interleave (a body with no image is pure prose).
  if (imaged.length === 0 || sections.length === 0) {
    return planBlogGalleries(sections, products, options);
  }

  // Reserve one mid-body section + the last imaged product for the split pane.
  const splitIdx = Math.floor(sections.length / 2);
  const splitSection = sections[splitIdx];
  const splitProduct = imaged[imaged.length - 1];
  const splitItem: L5FlowItem = {
    kind: "split",
    section: splitSection,
    product: splitProduct,
  };

  // Plan galleries over the REMAINING sections + images (the reserved ones removed).
  const remainingSections = sections.filter((_, i) => i !== splitIdx);
  const remainingImaged = imaged.slice(0, imaged.length - 1);
  const base = planBlogGalleries(remainingSections, remainingImaged, options);

  // splitIdx === 0 only when there is a single section (floor(1/2) === 0): the
  // split leads, followed by any galleries planned over the leftover images.
  if (splitIdx === 0) {
    return [splitItem, ...base];
  }

  // Otherwise re-insert the split right after the section that precedes it in
  // document order (its slug id is stable across the base plan).
  const anchorId = sections[splitIdx - 1].id;
  const flow: L5FlowItem[] = [];
  let inserted = false;
  for (const item of base) {
    flow.push(item);
    if (!inserted && item.kind === "section" && item.section.id === anchorId) {
      flow.push(splitItem);
      inserted = true;
    }
  }
  // Safety net: never drop the split if the anchor section wasn't found.
  if (!inserted) flow.push(splitItem);
  return flow;
}

/* ── Harness progress timeline (SPEC-151) ─────────────────────────────────── */

/** Append a harness progress phrase to the accumulated timeline, collapsing a
 * CONSECUTIVE duplicate so a repeated `{status}` frame never adds a second row.
 * A non-consecutive repeat is kept (it is a genuinely new step). Returns the
 * SAME array reference when the phrase is collapsed, so a `setState` caller does
 * not re-render on a no-op frame. Pure — unit-tested. Shared by the new-blog
 * generation surface (`BlogDraftStreaming`) and the refine loop (`BlogDetail`),
 * which both reveal harness PROGRESS instead of the discarded live drafts. */
export function appendProgressPhase(phases: string[], phrase: string): string[] {
  return phases[phases.length - 1] === phrase ? phases : [...phases, phrase];
}

/** Proxy path for a draft's composited editorial hero PNG (backend SPEC-122).
 * Served through `/api/proxy` (same base the client mutations use) so the
 * httpOnly token is injected server-side and an `<img>` can point at it
 * directly — the proxy streams the `image/png` body through untouched. The
 * optional `version` (the draft's `updatedAt`, restamped on each regenerate)
 * cache-busts the URL so a freshly generated hero paints instead of a stale
 * cached one. Returns a 404 for drafts without a hero yet — the banner then
 * falls back to the product photo (handled at the `<img>` `onError`). */
export function heroUrl(draftId: number, version?: string | null): string {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy"}/spotlight/drafts/${draftId}/hero`;
  return version ? `${base}?v=${encodeURIComponent(version)}` : base;
}

/* ── Written to beat (SPEC-292, backend SPEC-286) ─────────────────────────── */

/** The two lines the draft's "Written to beat" panel says under the page link:
 * what the plan had to cover, and what it added because the page missed it. */
export function beatLines(beat: {
  headings: string[];
  wordCount: number;
  misses: string[];
}): { covered: string; added: string | null } {
  const n = beat.headings.length;
  const words = beat.wordCount > 0 ? ` · ${formatNumber(beat.wordCount)} words` : "";
  const covered =
    n > 0
      ? `Covered its ${n} heading${n === 1 ? "" : "s"} with more specific advice${words}`
      : `Written longer and more specific than the page${words}`;
  const added = beat.misses.length > 0 ? `Added what it misses: ${beat.misses.join(" · ")}` : null;
  return { covered, added };
}
