/**
 * Microsoft Clarity insight shapes (backend SPEC-219).
 *
 * Note where `number | null` is used deliberately: **null means "not measured", 0 means
 * "measured, and it is zero".** Collapsing the two would make a blog nobody has looked
 * at indistinguishable from a blog nobody read.
 */

/** The latest Clarity pull (backend SPEC-270) — a `sync_logs` row with live
 * progress overlaid while it runs; null before any run. */
export interface ClaritySyncRun {
  state: "running" | "success" | "error";
  startedAt: string | null;
  finishedAt: string | null;
  /** `clarity_daily` rows written by the run. */
  records: number;
  /** Slices pulled so far / to pull (3) — only while running, else null. */
  done: number | null;
  total: number | null;
  /** `unauthorized` · `throttled` · `error` on a failed run. */
  error: string | null;
  /** `no_data` on a successful run that wrote nothing (tag not installed yet). */
  reason: string | null;
}

export interface ClarityBudget {
  used: number;
  limit: number;
  remaining: number;
}

export interface ClarityStatus {
  /** A token is configured (DB or .env). */
  configured: boolean;
  /** At least one day has been captured. */
  connected: boolean;
  capturedOn: string | null;
  sync: ClaritySyncRun | null;
  budget: ClarityBudget;
  /** "04:15" — the scheduled pull, UTC. */
  nextRunUtc: string;
}

export interface ClarityBlogPost {
  draftId: number;
  title: string;
  handle: string;
  liveUrl: string | null;
  wordCount: number;
  seoScore: number | null;
  qualityScore: number | null;
  measured: boolean;
  sessions: number | null;
  avgScrollDepth: number | null;
  avgActiveSeconds: number | null;
  rageClicks: number | null;
  deadClicks: number | null;
  /** wordCount x avgScrollDepth — where readers actually stop. */
  stopsAroundWord: number | null;
}

export interface ClarityBlogEngagement {
  connected: boolean;
  capturedOn: string | null;
  windowDays: number;
  posts: ClarityBlogPost[];
}

/** Deep links into the store's own Clarity project (backend SPEC-278) — the
 * page's Visited-URL filter plus, where Clarity has one, the issue filter. */
export interface ClarityLinks {
  dashboard: string;
  recordings: string;
  rageClicks: string;
  deadClicks: string;
  quickBacks: string;
  /** No verified Clarity parameter — the page's recordings. */
  scriptErrors: string;
  errorClicks: string;
}

export interface ClarityFrictionPage {
  handle: string;
  title: string;
  path: string;
  sessions: number;
  rageClicks: number;
  deadClicks: number;
  scriptErrors: number;
  errorClicks: number;
  quickBacks: number;
  excessiveScroll: number;
  /** 0–1. */
  avgScrollDepth: number;
  avgActiveSeconds: number;
  frictionEvents: number;
  revenue90d: number;
  units90d: number;
  /** False when no variant on this product has a cost — margin is unknown, not zero. */
  marginKnown: boolean;
  /** Null when no Clarity project id is configured — then there is no link. */
  clarity: ClarityLinks | null;
}

/** One row of the Brief's "what broke yesterday" (backend SPEC-281). */
export interface ClarityBrokePage extends ClarityFrictionPage {
  /** `new` — no friction on any prior day; `up` — ≥ 2× the prior week's daily average. */
  reason: "new" | "up";
  priorDailyAvg: number;
}

export interface ClarityBrokeYesterday {
  connected: boolean;
  capturedOn: string | null;
  windowDays: number;
  revenueDays: number;
  minRevenue: number;
  pages: ClarityBrokePage[];
  /** Other product pages with friction on the day, none listed. */
  others: number;
  othersMaxRevenue: number;
  totalRevenue: number;
}

export interface ClarityFrictionDay {
  capturedOn: string;
  sessions: number;
  rageClicks: number;
  deadClicks: number;
  scriptErrors: number;
  errorClicks: number;
  quickBacks: number;
  excessiveScroll: number;
  avgScrollDepth: number;
  frictionEvents: number;
}

export interface ClarityFrictionPath {
  path: string;
  sessions: number;
  frictionEvents: number;
}

/** One product page's friction (backend SPEC-278 `GET /clarity/friction/{handle}`). */
export interface ClarityFrictionDetail {
  connected: boolean;
  capturedOn: string | null;
  windowDays: number;
  revenueDays: number;
  page: ClarityFrictionPage;
  days: ClarityFrictionDay[];
  paths: ClarityFrictionPath[];
}

export interface ClarityFriction {
  connected: boolean;
  capturedOn: string | null;
  windowDays: number;
  revenueDays: number;
  pages: ClarityFrictionPage[];
}

export interface ClaritySource {
  /** The channel key (backend SPEC-219 patch): "meta", "email", "google", a bare host… */
  source: string;
  /** What the owner reads: "Meta (Facebook & Instagram)", "Email", "Google"… */
  label: string;
  /** The names Clarity used that were merged into this channel, lower-cased. */
  rawSources: string[];
  /** The store's own domain or direct traffic — not a campaign (backend SPEC-281). */
  internal: boolean;
  sessions: number;
  avgScrollDepth: number;
  avgActiveSeconds: number;
  rageClicks: number;
  quickBacks: number;
  attributedOrders: number;
  attributedRevenue: number;
}

export interface ClarityCampaigns {
  connected: boolean;
  capturedOn: string | null;
  windowDays: number;
  /** How many days Clarity has captured in the window, and the first of them —
   * the orders are joined over exactly those days (backend SPEC-281). */
  daysCaptured: number;
  fromDay: string | null;
  sources: ClaritySource[];
}
