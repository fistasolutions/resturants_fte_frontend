/**
 * Brand Brain › Competitors (SPEC-283) — the pure half: adapters over backend
 * SPEC-280, the view segments, the words a card uses, and what a run's steps mean
 * for the toast. No fetch, no React — Vitest covers it.
 */

import type {
  Competitor,
  CompetitorOrigin,
  CompetitorRun,
  CompetitorStatus,
  CompetitorSummary,
} from "@/types/brand-brain";
import { formatWholeMoney } from "@/utils/format";

/* ── API shapes ─────────────────────────────────────────────────────────── */

export interface ApiCompetitor {
  id: number;
  name: string;
  domain: string;
  website: string;
  status: string;
  origin: string;
  owner_note?: string | null;
  why?: string;
  overlap_queries?: number | null;
  overlap_page_two?: number | null;
  categories?: string[];
  price_min?: number | null;
  price_max?: number | null;
  shipping?: string;
  returns?: string;
  content_cadence?: string;
  positioning?: string;
  where_you_win?: string;
  gap_topics?: string[];
  gaps_filed?: string[];
  pages_read?: string[];
  read_error?: string | null;
  fact_id?: number | null;
  created_at?: string | null;
  reviewed_at?: string | null;
  last_read_at?: string | null;
  run?: ApiCompetitorRun;
}

export interface ApiCompetitorRun {
  id: number;
  kind: string;
  competitor_id?: number | null;
  status: string;
  steps?: { at: string; label: string; done?: boolean }[];
  found?: number;
  error?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface ApiCompetitorSummary {
  tracked: number;
  review: number;
  rejected: number;
  gap_topics: number;
  last_researched: string | null;
  running: ApiCompetitorRun | null;
  web_search: boolean;
  web_search_provider?: string | null;
}

function status(raw: string): CompetitorStatus {
  return raw === "approved" || raw === "rejected" ? raw : "pending";
}

function origin(raw: string): CompetitorOrigin {
  return raw === "owner" ? "owner" : "agent";
}

export function adaptCompetitor(raw: ApiCompetitor): Competitor {
  return {
    id: raw.id,
    name: raw.name,
    domain: raw.domain,
    website: raw.website,
    status: status(raw.status),
    origin: origin(raw.origin),
    ownerNote: raw.owner_note ?? null,
    why: raw.why ?? "",
    overlapQueries: raw.overlap_queries ?? null,
    overlapPageTwo: raw.overlap_page_two ?? null,
    categories: raw.categories ?? [],
    priceMin: raw.price_min ?? null,
    priceMax: raw.price_max ?? null,
    shipping: raw.shipping ?? "",
    returns: raw.returns ?? "",
    contentCadence: raw.content_cadence ?? "",
    positioning: raw.positioning ?? "",
    whereYouWin: raw.where_you_win ?? "",
    gapTopics: raw.gap_topics ?? [],
    gapsFiled: raw.gaps_filed ?? [],
    pagesRead: raw.pages_read ?? [],
    readError: raw.read_error ?? null,
    factId: raw.fact_id ?? null,
    createdAt: raw.created_at ?? null,
    reviewedAt: raw.reviewed_at ?? null,
    lastReadAt: raw.last_read_at ?? null,
  };
}

export function adaptCompetitorRun(raw: ApiCompetitorRun): CompetitorRun {
  return {
    id: raw.id,
    kind: raw.kind === "read" ? "read" : "find",
    competitorId: raw.competitor_id ?? null,
    status: raw.status === "done" || raw.status === "failed" ? raw.status : "running",
    steps: (raw.steps ?? []).map((s) => ({ at: s.at, label: s.label, done: Boolean(s.done) })),
    found: raw.found ?? 0,
    error: raw.error ?? null,
    startedAt: raw.started_at ?? null,
    finishedAt: raw.finished_at ?? null,
  };
}

export function adaptCompetitorSummary(raw: ApiCompetitorSummary): CompetitorSummary {
  return {
    tracked: raw.tracked ?? 0,
    review: raw.review ?? 0,
    rejected: raw.rejected ?? 0,
    gapTopics: raw.gap_topics ?? 0,
    lastResearched: raw.last_researched ?? null,
    running: raw.running ? adaptCompetitorRun(raw.running) : null,
    webSearch: Boolean(raw.web_search),
    webSearchProvider: raw.web_search_provider ?? null,
  };
}

/* ── views (URL state) ──────────────────────────────────────────────────── */

export type CompetitorView = "approved" | "review" | "rejected";

export const COMPETITOR_VIEWS: { key: CompetitorView; label: string; status: CompetitorStatus }[] = [
  { key: "approved", label: "Approved", status: "approved" },
  { key: "review", label: "To review", status: "pending" },
  { key: "rejected", label: "Rejected", status: "rejected" },
];

/** `?view=` → a view; an unknown value is the approved list, no value is the tab's own default. */
export function viewFromParam(value: string | null | undefined): CompetitorView | null {
  if (value === null || value === undefined) return null;
  return value === "review" || value === "rejected" ? value : "approved";
}

/**
 * The view the tab opens on when the URL names none: the review queue while
 * something waits and nothing is approved yet (a run's finds must never land the
 * owner on an empty list), otherwise the approved list.
 */
export function defaultView(counts: Pick<Record<CompetitorView, number>, "approved" | "review">): CompetitorView {
  return counts.review > 0 && counts.approved === 0 ? "review" : "approved";
}

/** A named view is always written (`?view=approved` included) so a click beats the default; no view is the bare tab. */
export function competitorsHref(view?: CompetitorView, add = false): string {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (add) params.set("add", "1");
  const query = params.toString();
  return `/spotlight/brand-brain/competitors${query ? `?${query}` : ""}`;
}

export function competitorHref(id: number): string {
  return `/spotlight/brand-brain/competitors/${id}`;
}

/** Competitors in the view, best evidence first: counted overlap, then newest. */
export function competitorsInView(rows: Competitor[], view: CompetitorView): Competitor[] {
  const wanted = COMPETITOR_VIEWS.find((v) => v.key === view)?.status ?? "approved";
  return rows
    .filter((c) => c.status === wanted)
    .sort(
      (a, b) =>
        (b.overlapQueries ?? -1) - (a.overlapQueries ?? -1) ||
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
        b.id - a.id,
    );
}

export function viewCounts(rows: Competitor[]): Record<CompetitorView, number> {
  return {
    approved: rows.filter((c) => c.status === "approved").length,
    review: rows.filter((c) => c.status === "pending").length,
    rejected: rows.filter((c) => c.status === "rejected").length,
  };
}

/* ── words ──────────────────────────────────────────────────────────────── */

export const ORIGIN_LABEL: Record<CompetitorOrigin, string> = {
  agent: "Found by the agent",
  owner: "Added by you",
};

/** The search vendor in the owner's words (SPEC-282). */
export const SEARCH_PROVIDER_LABEL: Record<string, string> = {
  gemini: "Gemini grounding",
  openai: "OpenAI web search",
  google_cse: "Google Custom Search",
};

export function searchProviderLabel(name: string | null): string {
  return (name && SEARCH_PROVIDER_LABEL[name]) || "web search";
}

export const STATUS_LABEL: Record<CompetitorStatus, string> = {
  pending: "Review",
  approved: "Approved",
  rejected: "Rejected",
};

/** "$39–$149" (in the store's currency), or "" when the pages showed no prices. */
export function priceBand(c: Pick<Competitor, "priceMin" | "priceMax">): string {
  if (c.priceMin === null || c.priceMax === null) return "";
  const f = (n: number) => formatWholeMoney(n);
  return c.priceMin === c.priceMax ? f(c.priceMin) : `${f(c.priceMin)}–${f(c.priceMax)}`;
}

/** The counted overlap in words, or the honest absence of it. */
export function overlapLine(c: Pick<Competitor, "overlapQueries" | "overlapPageTwo">): string {
  if (c.overlapQueries === null) return "overlap not measured";
  const base = `overlaps ${c.overlapQueries} of your searches`;
  return c.overlapPageTwo ? `${base} · ${c.overlapPageTwo} where you sit on page two` : base;
}

export interface AxisRow {
  key: "price" | "shipping" | "returns" | "content";
  label: string;
  theirs: string;
}

/** The comparison axes with something read on them — never an empty box. */
export function axisRows(c: Competitor): AxisRow[] {
  const rows: AxisRow[] = [];
  const band = priceBand(c);
  if (band) rows.push({ key: "price", label: "Price band", theirs: band });
  if (c.shipping) rows.push({ key: "shipping", label: "Shipping", theirs: c.shipping });
  if (c.returns) rows.push({ key: "returns", label: "Returns", theirs: c.returns });
  if (c.contentCadence) rows.push({ key: "content", label: "Content", theirs: c.contentCadence });
  return rows;
}

/* ── the run, for the toast ─────────────────────────────────────────────── */

/** 0–1 from the steps written so far; a find has ~9 steps, a read 3. */
export function runProgress(run: Pick<CompetitorRun, "kind" | "status" | "steps">): number {
  if (run.status !== "running") return 1;
  const expected = run.kind === "find" ? 9 : 3;
  return Math.min(0.95, run.steps.length / expected);
}

export function runTitle(run: Pick<CompetitorRun, "kind" | "status" | "found" | "error">): string {
  if (run.status === "failed") return run.kind === "find" ? "Finding competitors stopped" : "Reading the site stopped";
  if (run.status === "done") {
    if (run.kind === "read") return "Profile written";
    return run.found === 0 ? "No new competitors found" : `${run.found} ${run.found === 1 ? "competitor" : "competitors"} found`;
  }
  return run.kind === "find" ? "Finding competitors" : "Reading the site";
}

/** "0:42" from a start stamp to now. */
export function elapsed(startedAt: string | null, nowMs: number): string {
  if (!startedAt) return "";
  const seconds = Math.max(0, Math.floor((nowMs - Date.parse(startedAt)) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "3 of 7 filed as topics" — what a competitor's gap topics did in the bank
 * (SPEC-292). Empty when it has no gap topics. */
export function gapsFiledLabel(c: { gapTopics: string[]; gapsFiled: string[] }): string {
  if (c.gapTopics.length === 0) return "";
  const filed = c.gapsFiled.length;
  if (filed === 0) return "none filed as topics — none match a category you sell";
  return `${filed} of ${c.gapTopics.length} filed as topics`;
}

/** Whether a gap topic is one of the filed ones (case-insensitive). */
export function isGapFiled(topic: string, filed: string[]): boolean {
  const key = topic.trim().toLowerCase();
  return filed.some((f) => f.trim().toLowerCase() === key);
}

/** A competitor's gap topics with the filed ones first, each group in its own
 * order (SPEC-292) — the card shows four, and the ones that became topics are
 * the ones worth seeing. */
export function orderGapTopics(c: { gapTopics: string[]; gapsFiled: string[] }): string[] {
  const filed = c.gapTopics.filter((t) => isGapFiled(t, c.gapsFiled));
  const rest = c.gapTopics.filter((t) => !isGapFiled(t, c.gapsFiled));
  return [...filed, ...rest];
}
