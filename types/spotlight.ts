/**
 * Spotlight (Brand Visibility Engine) — the future API contract (SPEC-109).
 * The MVP ships frontend-only on mock data; these interfaces are what the
 * backend research / content-generation / Search-Console services will return,
 * so components bind to them now and the data source swaps in a later phase.
 * `store_id`-scoped by construction, like the rest of the platform.
 */

/** The four ways Spotlight can know a fact — the core Brand Brain UI primitive. */
/** `file` (SPEC-263): extracted from an uploaded source and approved by the owner. */
export type ProvenanceSource = "onboarding" | "measured" | "research" | "manual" | "file";

/* ── Overview ─────────────────────────────────────────────────────────── */

export type PipelineStatus = "complete" | "in_progress" | "not_started";

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  /** 0–100, already computed by the backend — the UI only renders the bar. */
  progress: number;
  status: PipelineStatus;
}

export interface SpotlightKpi {
  id: string;
  label: string;
  /** Pre-formatted for display — the backend owns the calculation (Rule 8). */
  value: string;
  /** Signed percent change vs the prior period; omitted when there's no baseline. */
  delta?: number;
  hint?: string;
}

export type ActivityKind = "research" | "draft" | "publish" | "approval" | "measure";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  timestamp: string;
}

export interface NextAction {
  id: string;
  title: string;
  detail: string;
  cta: string;
  /** In-app deep link (e.g. a tab or /integrations); omitted for no-op nudges. */
  href?: string;
}

export interface OverviewData {
  pipeline: PipelineStage[];
  kpis: SpotlightKpi[];
  activity: ActivityItem[];
  nextActions: NextAction[];
}

/* ── Brand Brain ──────────────────────────────────────────────────────── */

/** Which Brand Brain group a fact belongs to (backend section). Only the first
 *  three are user-editable/addable; measured proof points are read-only. */
export type FactSection =
  | "identity"
  | "voice"
  | "guardrail"
  | "proof_point"
  | "product"
  | "policy"
  | "calendar"
  | "competitor"
  | "market";

export interface Fact {
  /** Backend row id — present for stored facts (CRUD target, SPEC-111); null
   *  for measured facts, which are computed live and never stored. */
  id?: number | null;
  /** The section this fact belongs to; drives where an inline add form lands. */
  section?: FactSection;
  label: string;
  value: string;
  source: ProvenanceSource;
  /** Provenance detail — e.g. the measurement window or a review source.
   *  Present for measured/owner-verified facts; omitted otherwise. */
  sourceNote?: string | null;
  /** ISO timestamp the owner last confirmed this fact; null for measured. */
  confirmedAt?: string | null;
  /** SPEC-263 — approved | pending | rejected | conflict; the writers read approved only. */
  status?: FactStatus;
  /** SPEC-263 — a guardrail can be switched off without being deleted. */
  enabled?: boolean;
  /** SPEC-263 — the uploaded source this fact was extracted from, and where in it. */
  sourceId?: number | null;
  sourceLocator?: string | null;
}

export type FactStatus = "approved" | "pending" | "rejected" | "conflict";

export interface Persona {
  /** Stable slug derived from the name — used for React keys. */
  id: string;
  /** Backend row id — the CRUD target (SPEC-111); null when not backend-served. */
  dbId?: number | null;
  name: string;
  tagline: string;
  description: string;
  traits: string[];
  source: ProvenanceSource;
  /** SPEC-263 — when the owner vouched for this persona; null until Confirm. */
  confirmedAt?: string | null;
  /** SPEC-267 — the Knowledge Base item it was read from. */
  sourceId?: number | null;
  /** Share of revenue attributed to this persona, 0–100. Omitted when the
   *  backend doesn't attribute revenue per persona (never fabricated). */
  share?: number;
}

/** Brand voice: how the brand speaks (tone) and what it must avoid. */
export interface VoiceGuide {
  tone: Fact | null;
  avoid: Fact | null;
}

/**
 * The real, backend-served Brand Brain (SPEC-108): owner-authored identity,
 * voice, and personas merged with metrics measured live from Shopify. Every
 * entry carries provenance so the UI can chip it (owner→onboarding,
 * measured→measured, research→research).
 */
export interface BrandBrainData {
  lastConfirmed: string;
  identity: Fact[];
  voice: VoiceGuide;
  guardrails: Fact[];
  personas: Persona[];
  proofPoints: Fact[];
  /** Editable search-intent templates the query bank derives from (SPEC-156). */
  intentTemplates: IntentTemplate[];
}

/** One search-intent template (backend SPEC-156): the phrasing the query bank
 * blankets each category with. `template` carries the `{category}` placeholder. */
export interface IntentTemplate {
  id: number;
  template: string;
  intent: string;
  persona: string;
  /** `default` = seeded, `manual` = owner-added/edited. */
  provenance: string;
  sort: number;
}

/* ── Inbound Engine ───────────────────────────────────────────────────── */

export type SearchIntent =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational";

export interface QueryBankItem {
  id: string;
  keyword: string;
  monthlyVolume: number;
  persona: string;
  intent: SearchIntent;
  cluster: string;
}

export type AssetChannel = "blog" | "linkedin";

export type AssetStatus =
  | "researching"
  | "drafting"
  | "in_review"
  | "approved"
  | "published"
  | "needs_changes";

export interface ContentAsset {
  id: string;
  title: string;
  channel: AssetChannel;
  status: AssetStatus;
  /** SEO-readiness score 0–100 (backend-scored). */
  seoScore: number;
  targetKeyword: string;
  persona: string;
  updatedAt: string;
}

export interface InboundData {
  queries: QueryBankItem[];
  assets: ContentAsset[];
}

/* ── Approvals ────────────────────────────────────────────────────────── */

export interface DraftSection {
  heading: string;
  summary: string;
}

export interface FeaturedDraft {
  id: string;
  title: string;
  targetKeyword: string;
  persona: string;
  excerpt: string;
  sections: DraftSection[];
  seoScore: number;
  publishTarget: string;
  estimatedReach: number;
  channel: AssetChannel;
  wordCount: number;
}

export interface QueuedAsset {
  id: string;
  title: string;
  channel: AssetChannel;
  seoScore: number;
  persona: string;
  submittedAt: string;
}

export interface ApprovalsData {
  featured: FeaturedDraft;
  queue: QueuedAsset[];
}

/* ── Visibility (backend SPEC-119: Google Search Console reach) ──────────── */

/** For avg. position a *lower* number is better, so the tile flips delta colors. */
export type DeltaKind = "up-good" | "down-good";

/**
 * Google Search Console connection status (backend `GET /integrations/google/status`).
 * `configured` = the server has GOOGLE_* env set; `connected` = this store is linked.
 * Metadata (email/property/last pull) is present only once connected — never faked.
 */
/** The latest Search Console pull (backend SPEC-257) — the `sync_logs` row with
 * live `done`/`total` overlaid while it runs; null before any run. */
export interface GoogleSyncRun {
  state: "running" | "success" | "error";
  startedAt: string | null;
  finishedAt: string | null;
  /** `gsc_daily` rows written by the run. */
  records: number;
  /** Published pages pulled so far / to pull — only while running, else null. */
  done: number | null;
  total: number | null;
  error: string | null;
}

export interface GoogleStatus {
  connected: boolean;
  configured: boolean;
  email: string | null;
  propertyUrl: string | null;
  /** ISO date of the last Search Console pull; null before the first sync. */
  lastPull: string | null;
  /** Connected, but the owner has not chosen a property yet (backend SPEC-257). */
  needsProperty: boolean;
  sync: GoogleSyncRun | null;
}

/** One Search Console property the connected account can see (backend SPEC-257). */
export interface GoogleProperty {
  siteUrl: string;
  /** Google's `permissionLevel`: siteOwner · siteFullUser · siteRestrictedUser · siteUnverifiedUser. */
  permissionLevel: string | null;
  /** Its permission level can query search analytics. */
  selectable: boolean;
  /** The store's own site — pre-selected in the picker. */
  recommended: boolean;
}

export interface GoogleProperties {
  /** The property currently stored for the store, if any. */
  selected: string | null;
  properties: GoogleProperty[];
}

/** One measured search query for a page (backend Search Console `top_queries`). */
export interface ReachQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  /** Average result position (lower is better). */
  position: number;
}

/**
 * Per published-post organic reach (backend `/spotlight/visibility` `posts[]`).
 * `estimated: true` means Search Console had no measured data for the post yet —
 * its numbers are zeroed placeholders, never invented (root Rule 8).
 */
/** Google's own index verdict for one published page (backend SPEC-261),
 * from the URL Inspection API on every Search Console pull. */
export type IndexState = "indexed" | "discovered" | "crawled" | "unknown" | "excluded" | "error";

export interface PostIndexStatus {
  state: IndexState;
  /** Google's wording, verbatim — e.g. "Discovered - currently not indexed". */
  coverageState: string;
  verdict: string;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  /** Pages Google found linking to this one. */
  referringUrls: string[];
  inspectedAt: string | null;
}

export interface IndexSummary {
  indexed: number;
  notIndexed: number;
  uninspected: number;
}

export interface PostReach {
  draftId: number;
  title: string;
  liveUrl: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  estimated: boolean;
  topQueries: ReachQuery[];
  /** Null until the first pull has inspected the page. */
  index: PostIndexStatus | null;
}

/** Pure display roll-ups over the returned posts — sums/counts and an
 * impression-weighted average position. No prior-period baseline is served, so
 * these carry no deltas (never fabricated). */
export interface VisibilityTotals {
  impressions: number;
  clicks: number;
  /** Impression-weighted mean position across measured posts; null if none. */
  avgPosition: number | null;
  /** Count of posts with real measured rows (`estimated: false`) — NOT Google's
   * index status; that is `VisibilityData.indexSummary` (SPEC-261). */
  measured: number;
}

/**
 * The Visibility tab payload (backend `/spotlight/visibility`). `connected`
 * flips the whole tab between the real reach view and the honest "connect
 * Google Search Console" empty state. `totals`/`topQueries` are pure display
 * aggregations of `posts` (computed in the adapter, unit-tested).
 */
export interface VisibilityData {
  connected: boolean;
  email: string | null;
  propertyUrl: string | null;
  windowDays: number;
  lastPull: string | null;
  posts: PostReach[];
  totals: VisibilityTotals;
  topQueries: ReachQuery[];
  /** From the backend (SPEC-261) — never recomputed from rows. */
  indexSummary: IndexSummary;
}

/* ── Live Inbound Engine + Approvals (backend SPEC-109) ───────────────────
 * The real, backend-served query bank and grounded blog drafts. These replace
 * the mock `InboundData` / `ApprovalsData` for the Inbound Engine and Approvals
 * tabs; Overview and Visibility stay on mock until their backends land. */

/** One SEO topic in the query bank. `intent`/`source` are backend vocabularies
 * (intent: high | seasonal | informational; source: derived | search_console),
 * kept as strings so a new backend value never breaks the type. */
export interface SpotlightQuery {
  id: number;
  keyword: string;
  /** Null until Search Console is connected (backend Slice 3) — never faked. */
  monthlyVolume: number | null;
  persona: string;
  intent: string;
  source: string;
  /** The topic cluster this query belongs to (backend SPEC-125), e.g. "skirts".
   * Null = ungrouped (a folded-in Search Console query with no category match) —
   * never a fabricated topic. The UI groups the bank by this. */
  cluster: string | null;
  /** The real store category behind a DISCOVERED keyword (backend SPEC-163) — a
   * scout keyword owns its own `cluster` (its topic IS the keyword), so this is
   * the link back to a category the store actually sells. Null for derived and
   * Search Console rows, which group by `cluster` directly. */
  parentCategory: string | null;
}

/** Draft lifecycle: generated at `in_review`, then human-gated to `approved`
 * or `changes_requested`. The publish states (backend SPEC-118): `published`
 * once the draft is live on Shopify, `unpublished` when hidden but kept, and
 * `draft` after the live article is deleted from the site (reset). */
export type BlogDraftStatus =
  | "in_review"
  | "approved"
  | "changes_requested"
  | "published"
  | "unpublished"
  | "draft";

/** A real store product the post links to (from an analytics tool result —
 * never invented by the agent; root Rule 8). `handle`/`imageUrl`/`url` arrive
 * with the detail read (backend Slice 1.5): `imageUrl` is the Shopify CDN photo
 * and `url` the full `/products/{handle}` storefront link. Null when the backend
 * couldn't supply one — never faked. */
export interface BlogDraftProduct {
  productId: number;
  title: string;
  handle: string | null;
  imageUrl: string | null;
  url: string | null;
}

/** Why the draft is on-brand: the persona + POV pillar it was written for, the
 * guardrail check, and the internal product links it grounds on. */
export interface BlogDraftGrounding {
  personaId: string | null;
  povPillar: string;
  guardrailsOk: boolean;
  products: BlogDraftProduct[];
}

/** One ordered step in the blog-writer agent's trace (a plain sentence). */
export type AgentTraceStep = string;

/* ── Quality harness scorecard (backend SPEC-121) ─────────────────────────
 * The write→critique→revise loop scores every draft on four dimensions and can
 * revise across several rounds. The persisted scores (`aeoScore`/`geoScore`/
 * `qualityScore`/`harnessRounds`) ride on every draft read; the per-round
 * `critique` and researched `sources` come back only on the detail read. */

/** The four scored dimensions of a draft: SEO (search), AEO (answer engines),
 * GEO (generative/LLMs), and Quality (brand). */
export interface QualityDimensionScores {
  seo: number;
  aeo: number;
  geo: number;
  quality: number;
}

/** Per-dimension critic notes for one revision round (plain sentences). */
export interface QualityDimensionNotes {
  seo: string;
  aeo: string;
  geo: string;
  quality: string;
}

/** One round of the critic's judgment (backend SPEC-121 harness). `min` is the
 * weakest dimension that gates the loop; `overall` is the critic's blended call. */
export interface CritiqueRound {
  round: number;
  scores: QualityDimensionScores;
  min: number;
  overall: number;
  notes: QualityDimensionNotes;
  feedback: string;
  /** The round the harness actually KEPT (backend SPEC-121 Patch). The harness
   * returns the best round, not the last, so this is the only reliable way to
   * find the critique describing the draft on screen. Absent on drafts written
   * before the marker existed. */
  isFinal: boolean;
}

/** One off-store citation the article grounds on — the researched-source signal
 * that proves the GEO/live-research grounding. Backend serves bare URL strings;
 * kept as an object so a later titled-source payload maps in without a break. */
export interface BlogSource {
  url: string;
}

/** The page-one competitor article a draft was written to beat (backend SPEC-286).
 * Measured, never written: its headings, and the template themes it missed that the
 * plan added. */
export interface BeatBrief {
  url: string;
  domain: string;
  name: string;
  title: string;
  headings: string[];
  wordCount: number;
  misses: string[];
  readAt: string | null;
}

/* ── Rich blog: FAQ + TOC + JSON-LD (backend SPEC-124) ─────────────────────
 * Derived on read from the draft body (no new columns). `faq` powers the visible
 * AEO accordion, `toc` the sticky table of contents, `jsonLd` the schema.org
 * (Article + FAQPage) structured data injected into the page. Detail read only;
 * empty/absent on list rows (never fabricated; root Rule 8). */

/** One parsed FAQ question + answer (the AEO block). */
export interface FaqItem {
  q: string;
  a: string;
}

/** One table-of-contents entry: an `## H2` heading and its slugified anchor id
 * (matches the id the body renderer stamps on that heading). */
export interface TocItem {
  id: string;
  text: string;
}

/** A schema.org JSON-LD object (Article or FAQPage). Kept as a loose record —
 * the backend owns the exact shape; the frontend only stringifies it. */
export type JsonLdObject = Record<string, unknown>;

/**
 * A grounded blog draft. The list read omits the heavy fields (`bodyMd`,
 * `grounding`, `agentTrace`); the detail read includes them. `sections` only
 * comes back on the generate response. Optional fields are absent, never faked.
 */
export interface BlogDraft {
  id: number;
  title: string;
  handle: string;
  metaDescription: string;
  targetKeyword: string;
  persona: string;
  povPillar: string;
  seoScore: number;
  /** Quality-harness scores (backend SPEC-121). SEO always present; AEO/GEO/
   * Quality are null for drafts written before the harness (never faked). */
  aeoScore: number | null;
  geoScore: number | null;
  qualityScore: number | null;
  /** How many write→critique→revise rounds produced this draft (≥1). */
  harnessRounds: number;
  wordCount: number;
  status: BlogDraftStatus;
  /** The effective brief/instruction that produced this draft (backend
   * SPEC-113): the keyword/brief on first generation, then the owner's
   * refinement on each regenerate. Prefills the "Request changes" refine modal.
   * Null for drafts written before the refine loop. */
  prompt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** The public storefront URL once published to Shopify (backend SPEC-118);
   * null while the draft has never gone live. */
  liveUrl: string | null;
  /** ISO timestamp of the last publish (backend SPEC-118); null if never live. */
  publishedAt: string | null;
  /** Reconcile flag from the published-list read (backend SPEC-118): false when
   * the live article 404s on Shopify. Undefined on non-published reads. */
  live?: boolean;
  // Detail-only (GET /drafts/{id}, generate, and status transitions).
  bodyMd?: string;
  grounding?: BlogDraftGrounding;
  agentTrace?: AgentTraceStep[];
  /** The per-round critic scorecard (backend SPEC-121) — detail read only.
   * Empty for list rows and pre-harness drafts (never faked). */
  critique: CritiqueRound[];
  /** What this draft was written to beat (SPEC-292); null when no approved
   * competitor ranked for the keyword or web search was not connected. */
  beat: BeatBrief | null;
  /** Off-store citations the article researched — detail read only. Empty when
   * the backend supplied none. */
  sources: BlogSource[];
  /** Rich-blog derivations (backend SPEC-124) — detail read only. `faq` is the
   * visible AEO Q&A, `toc` the table of contents, `jsonLd` the schema.org
   * structured data. Empty for list rows / pre-SPEC-124 backends (never faked). */
  faq: FaqItem[];
  toc: TocItem[];
  jsonLd: JsonLdObject[];
  // Generate-only (POST /drafts).
  sections?: string[];
}

/* ── Inbound topics (backend SPEC-275 / frontend SPEC-277) ────────────────── */

export type TopicState = "none" | "draft" | "published";
/** Where a bank row came from: measured Search Console demand, the store's own
 * catalog, the Keyword Scout, or — SPEC-292 — a topic an approved competitor
 * publishes that the store does not (backend SPEC-286). */
export type TopicSource = "search_console" | "derived" | "researched" | "competitor_gap";
/** A content topic, the home for searches for the store by name (never a post),
 * or the home for Google searches no category claimed (SPEC-277). */
export type TopicKind = "topic" | "brand" | "other";

export interface InboundTopicRow {
  /** Null for the page-two winner the bank never held verbatim — the backend adds
   * it as a line from Search Console (SPEC-275), and Write this targets it by keyword. */
  id: number | null;
  keyword: string;
  volume: number | null;
  /** Google's average position for exactly this query, when the snapshot has it. */
  position: number | null;
  /** Clicks a page-one move would add — only for a page-two query. */
  potentialClicks: number | null;
  intent: string;
  source: string;
  /** Whose gap a competitor-gap row is — the competitor's domain (SPEC-292). */
  sourceRef: string | null;
  persona: string;
  /** ISO date the search entered the bank (SPEC-277): created_at for derived and
   * researched rows, first-seen snapshot day for Search Console rows. */
  addedOn: string | null;
  /** Entered since the last successful nightly rebuild. */
  isNew: boolean;
}

export interface InboundTopic {
  kind: TopicKind;
  cluster: string;
  category: string;
  persona: string;
  intent: string;
  source: TopicSource;
  queries: number;
  volume: number;
  bestPosition: number | null;
  bestQuery: string | null;
  potentialClicks: number;
  state: TopicState;
  draftId: number | null;
  draftStatus: string | null;
  publishedAt: string | null;
  /** In today's picks. */
  focus: boolean;
  /** Discovery rows filed under this topic — Keyword Scout finds and competitor
   * gaps (SPEC-277 — one phrase, one home; SPEC-292). */
  angles: number;
  /** The competitor domains whose gaps sit in this topic (SPEC-292). */
  gapRefs: string[];
  /** The newest `addedOn` across the topic's rows. */
  newestOn: string | null;
  newCount: number;
  rows: InboundTopicRow[];
}

export interface InboundSummary {
  topics: number;
  queries: number;
  gscQueries: number;
  derived: number;
  researched: number;
  /** Bank rows filed from approved competitors' gap topics (SPEC-292). */
  competitorGaps: number;
  demandTotal: number;
  /** Monthly demand held by content topics (brand searches excluded). */
  topicDemand: number;
  /** Monthly demand that is people searching for the store by name. */
  brandDemand: number;
  pageTwoQueries: number;
  pageTwoClicks: number;
  topQuery: { query: string; position: number; potentialClicks: number } | null;
  written: number;
  unwritten: number;
  focusTopics: number;
  /** SPEC-277 — the run facts the tab names instead of hiding. */
  angles: number;
  newQueries: number;
  newTopics: number;
  /** Last successful nightly rebuild (ISO datetime), null when none is recorded. */
  rebuiltAt: string | null;
  windowStart: string | null;
  scoutLastAddedOn: string | null;
  scoutLastAddedCount: number;
  /** The store-local date the backend computed the payload for. */
  today: string | null;
}

export interface InboundTopicsData {
  windowEnd: string | null;
  summary: InboundSummary;
  topics: InboundTopic[];
}

/* ── Published posts (backend SPEC-118) ───────────────────────────────────
 * The Published tab payload: our `published` rows with a light reconcile against
 * Shopify. The backend serializes the draft record's core fields + a `live`
 * flag; `seoScore`/`persona`/`imageUrl` are optional enrichment that the current
 * `GET /spotlight/published` payload does not carry — they map through only if a
 * later backend adds them, and are never fabricated (root Rule 8). */
export interface PublishedPost {
  id: number;
  title: string;
  handle: string;
  status: BlogDraftStatus;
  targetKeyword: string;
  /** The public storefront URL of the live article; null if reconciled away. */
  liveUrl: string | null;
  publishedAt: string | null;
  /** When and why the post left the live set (backend SPEC-279): `owner` (Unpublish
   * in the product), `hidden_on_shopify`, `missing_on_shopify`, `unrecorded`. Null
   * while live. */
  unpublishedAt: string | null;
  unpublishedReason: string | null;
  /** False when Shopify 404s the live article (row flipped to unpublished). */
  live: boolean;
  /** Optional enrichment — present only if the backend serializes it. */
  seoScore: number | null;
  persona: string | null;
  imageUrl: string | null;
  /** Blog → sales attribution (backend SPEC-126): orders + revenue attributed to
   * this post via the order landing page, over the attribution window. 0 when
   * nothing is attributed yet (never fabricated; root Rule 8). */
  attributedOrders: number;
  attributedRevenue: number;
  /** Customer-journey attribution (backend SPEC-197). `attributed*` above only
   * counts a buyer who ENTERED on this article and bought in that same session;
   * these count the visit that introduced the buyer (`firstTouch*`, possibly days
   * before checkout) and the visit they bought on (`lastTouch*`). 0 when nothing
   * is attributed yet — never fabricated (root Rule 8). */
  firstTouchOrders: number;
  firstTouchRevenue: number;
  lastTouchOrders: number;
  lastTouchRevenue: number;
}

/** How much of the attribution window has actually had its customer journey
 * fetched (backend SPEC-197). Exists so a zero can be told apart from a blind
 * spot: "the blogs earned nothing" and "we have not looked yet" demand opposite
 * reactions, and the UI must never let the owner confuse them. */
export interface JourneyCoverage {
  orders: number;
  fetched: number;
  withJourney: number;
  /** 0–1. Fetched ÷ orders in the window. */
  ratio: number;
}

/* ── Daily Picks (backend SPEC-155) ───────────────────────────────────────── */

/** The deterministic backend score breakdown for one pick (0–1 each). Ranking is
 * backend-owned (root Rule 8) — the UI only displays these, never re-ranks. */
export interface DailyPickScoreParts {
  /** The topic's own worth 0–1 before the rotation/performance multipliers (backend
   * SPEC-164 Patches). The card leads with this; absent on older snapshots. */
  fit?: number;
  demand: number;
  margin: number;
  catalog: number;
  brandFit: number;
  /** Rotation decay (backend SPEC-159), 0.25–1. A MULTIPLIER, not a 0–1
   * component — never render it as a score bar. 1 = never covered. */
  freshness: number;
  /** Learning-loop feedback (backend SPEC-161), 0.90–1.15. Also a multiplier.
   * Exactly 1 means unmeasured — no published post yet, so no effect. */
  performance: number;
  /** Striking distance (backend SPEC-264), 0–1 — present ONLY when the backend
   * measured it (a Search Console snapshot existed and at least one cluster sat
   * in the 8–25 band). Absent means the legacy four-part score. */
  striking?: number;
}

/** The query behind a pick's striking-distance score (backend SPEC-264): a
 * search the store already ranks 8–25 for. */
export interface PickStriking {
  query: string;
  position: number;
  impressions: number;
  /** Clicks a page-one move would add over the 28-day window. */
  potentialClicks: number;
  matchedQueries: number;
}

/** Where a pick came from (backend SPEC-125 vocabulary + SPEC-159's discovery
 * lane). `search_console` is real measured demand, `researched` is the agent's
 * unproven find, `derived` is generated from the catalog. */
export type DailyPickSource = "search_console" | "researched" | "derived";

/** One of the day's top-10 blog-title picks: the research agent's creative layer
 * (title/angle/fills/rationale/products) over a backend-ranked query cluster. */
export interface DailyPick {
  cluster: string;
  /** The representative query-bank keyword — the generation seed for a draft. */
  keyword: string;
  intent: string;
  persona: string;
  title: string;
  angle: string;
  fills: string;
  rationale: string;
  /** Real catalog product ids the article should feature (never fabricated). */
  featuredProductIds: number[];
  /** The overall backend opportunity score, 0–1. */
  score: number;
  scoreParts: DailyPickScoreParts;
  /** Provenance — drives the chip that stops a research guess reading as a
   * measurement. Defaults to "derived" on snapshots frozen before SPEC-159. */
  source: string;
  /** The competitor's domain behind a `competitor_gap` pick (SPEC-292). */
  sourceRef: string | null;
  /** The draft written from this pick's keyword, if one exists — computed at read
   * time, so it always reflects the current state (null once a draft is deleted).
   * When set, the card links to the draft instead of offering "Write this". */
  draftId: number | null;
  /** That draft's status (in_review | approved | published | …), or null. */
  draftStatus: string | null;
  /** Backend SPEC-264 evidence; null when nothing in the cluster is in striking distance. */
  striking: PickStriking | null;
}

/* ── Striking distance (backend SPEC-264) ─────────────────────────────────── */

export interface StrikingOpportunity {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  potentialClicks: number;
  /** The query-bank cluster the query maps to, or null when no topic matches. */
  cluster: string | null;
}

export interface StrikingDistanceData {
  /** The snapshot date; null before the first Search Console pull. */
  windowEnd: string | null;
  windowDays: number;
  opportunities: StrikingOpportunity[];
}

/** A dated snapshot of the day's picks — one immutable set per store per day. */
export interface DailyPicksSnapshot {
  pickDate: string;
  generatedAt: string | null;
  /** How the snapshot was made: the daily scheduler, or an owner refresh. */
  source: "scheduled" | "manual";
  picks: DailyPick[];
}

/** One row in the history date picker — the `picks` bodies are not loaded. */
export interface DailyPicksHistoryEntry {
  pickDate: string;
  generatedAt: string | null;
}
