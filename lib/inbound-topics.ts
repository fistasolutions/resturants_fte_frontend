/**
 * The Inbound Engine as topics (SPEC-277, extended by SPEC-279) — the pure half: the
 * adapter over backend SPEC-275/277's `/spotlight/inbound`, the segments, the Added
 * window, filtering, sorting and the words a card uses. No fetch, no React — Vitest
 * covers it.
 */

import { querySourceLabel } from "@/lib/spotlight";
import type { InboundSummary, InboundTopic, InboundTopicRow, InboundTopicsData, TopicKind, TopicSource, TopicState } from "@/types/spotlight";

/* ── API shapes ─────────────────────────────────────────────────────────── */

export interface ApiInboundRow {
  id: number | null;
  keyword: string;
  volume: number | null;
  position: number | null;
  potential_clicks: number | null;
  intent: string;
  source: string;
  source_ref?: string | null;
  persona: string;
  added_on?: string | null;
  new?: boolean;
}

export interface ApiInboundTopic {
  kind?: string;
  cluster: string;
  category: string;
  persona: string;
  intent: string;
  source: string;
  queries: number;
  volume: number;
  best_position: number | null;
  best_query: string | null;
  potential_clicks: number;
  state: string;
  draft_id: number | null;
  draft_status: string | null;
  published_at: string | null;
  focus: boolean;
  angles?: number;
  gap_refs?: string[];
  newest_on?: string | null;
  new_count?: number;
  rows: ApiInboundRow[];
}

export interface ApiInboundTopics {
  window_end: string | null;
  summary: {
    topics: number;
    queries: number;
    gsc_queries: number;
    derived: number;
    researched: number;
    competitor_gaps?: number;
    demand_total: number;
    topic_demand?: number;
    brand_demand?: number;
    page_two_queries: number;
    page_two_clicks: number;
    top_query: { query: string; position: number; potential_clicks: number } | null;
    written: number;
    unwritten: number;
    focus_topics: number;
    angles?: number;
    new_queries?: number;
    new_topics?: number;
    rebuilt_at?: string | null;
    window_start?: string | null;
    scout_last_added_on?: string | null;
    scout_last_added_count?: number;
    today?: string | null;
  };
  topics: ApiInboundTopic[];
}

function topicSource(raw: string): TopicSource {
  return raw === "search_console" || raw === "researched" || raw === "competitor_gap"
    ? raw
    : "derived";
}

function topicKind(raw: string | undefined): TopicKind {
  return raw === "brand" || raw === "other" ? raw : "topic";
}

function topicState(raw: string): TopicState {
  return raw === "draft" || raw === "published" ? raw : "none";
}

export function adaptInboundRow(raw: ApiInboundRow): InboundTopicRow {
  return {
    id: raw.id ?? null,
    keyword: raw.keyword,
    volume: raw.volume ?? null,
    position: raw.position ?? null,
    potentialClicks: raw.potential_clicks ?? null,
    intent: raw.intent,
    source: raw.source,
    sourceRef: raw.source_ref ?? null,
    persona: raw.persona ?? "",
    addedOn: raw.added_on ?? null,
    isNew: Boolean(raw.new),
  };
}

export function adaptInboundTopic(raw: ApiInboundTopic): InboundTopic {
  return {
    kind: topicKind(raw.kind),
    cluster: raw.cluster,
    category: raw.category,
    persona: raw.persona ?? "",
    intent: raw.intent,
    source: topicSource(raw.source),
    queries: raw.queries,
    volume: raw.volume,
    bestPosition: raw.best_position ?? null,
    bestQuery: raw.best_query ?? null,
    potentialClicks: raw.potential_clicks ?? 0,
    state: topicState(raw.state),
    draftId: raw.draft_id ?? null,
    draftStatus: raw.draft_status ?? null,
    publishedAt: raw.published_at ?? null,
    focus: Boolean(raw.focus),
    angles: raw.angles ?? 0,
    gapRefs: raw.gap_refs ?? [],
    newestOn: raw.newest_on ?? null,
    newCount: raw.new_count ?? 0,
    rows: (raw.rows ?? []).map(adaptInboundRow),
  };
}

export function adaptInboundTopics(raw: ApiInboundTopics): InboundTopicsData {
  const s = raw.summary;
  const summary: InboundSummary = {
    topics: s.topics,
    queries: s.queries,
    gscQueries: s.gsc_queries,
    derived: s.derived,
    researched: s.researched,
    competitorGaps: s.competitor_gaps ?? 0,
    demandTotal: s.demand_total,
    topicDemand: s.topic_demand ?? s.demand_total,
    brandDemand: s.brand_demand ?? 0,
    pageTwoQueries: s.page_two_queries,
    pageTwoClicks: s.page_two_clicks,
    topQuery: s.top_query ? { query: s.top_query.query, position: s.top_query.position, potentialClicks: s.top_query.potential_clicks } : null,
    written: s.written,
    unwritten: s.unwritten,
    focusTopics: s.focus_topics,
    angles: s.angles ?? 0,
    newQueries: s.new_queries ?? 0,
    newTopics: s.new_topics ?? 0,
    rebuiltAt: s.rebuilt_at ?? null,
    windowStart: s.window_start ?? null,
    scoutLastAddedOn: s.scout_last_added_on ?? null,
    scoutLastAddedCount: s.scout_last_added_count ?? 0,
    today: s.today ?? null,
  };
  return { windowEnd: raw.window_end ?? null, summary, topics: raw.topics.map(adaptInboundTopic) };
}

/* ── the Added window (SPEC-279) ────────────────────────────────────────── */

export type AddedWindow = "today" | "7" | "30" | "all";

export const ADDED_WINDOWS: { key: AddedWindow; label: string; days: number | null }[] = [
  { key: "today", label: "Today", days: 0 },
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "all", label: "All time", days: null },
];

export const DEFAULT_ADDED_WINDOW: AddedWindow = "30";

function dayNumber(iso: string): number {
  return Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / 86_400_000);
}

/** Whether a row's added date falls inside the window ending on `today` (ISO date).
 * An undated row is treated as old — it can only be found under All time. */
export function rowInWindow(row: InboundTopicRow, window: AddedWindow, today: string | null): boolean {
  if (window === "all") return true;
  if (!row.addedOn || !today) return false;
  const days = ADDED_WINDOWS.find((w) => w.key === window)?.days ?? null;
  if (days === null) return true;
  const age = dayNumber(today) - dayNumber(row.addedOn);
  return age >= 0 && age <= days;
}

/** A topic seen through the window: its rows, counts and angles follow it, and
 * `hiddenRows` says how many earlier searches the window keeps out of sight. */
export type WindowedTopic = InboundTopic & { hiddenRows: number };

export function applyAddedWindow(topics: InboundTopic[], window: AddedWindow, today: string | null): WindowedTopic[] {
  const out: WindowedTopic[] = [];
  for (const t of topics) {
    const rows = t.rows.filter((r) => rowInWindow(r, window, today));
    if (rows.length === 0) continue;
    const hidden = t.rows.length - rows.length;
    // The synthetic Search Console line (id null) is not a bank row — keep the
    // bank's own count honest.
    const bankRows = rows.filter((r) => r.id !== null).length;
    out.push({
      ...t,
      rows,
      queries: window === "all" ? t.queries : bankRows,
      // Discovery rows — scout finds and competitor gaps (SPEC-292) — in the window.
      angles:
        window === "all"
          ? t.angles
          : rows.filter((r) => r.source === "researched" || r.source === "competitor_gap").length,
      gapRefs:
        window === "all"
          ? t.gapRefs
          : [...new Set(rows.flatMap((r) => (r.source === "competitor_gap" && r.sourceRef ? [r.sourceRef] : [])))],
      hiddenRows: hidden,
    });
  }
  return out;
}

/** Searches per window — the numbers on the Added segments. */
export function addedCounts(topics: InboundTopic[], today: string | null): Record<AddedWindow, number> {
  const out: Record<AddedWindow, number> = { today: 0, "7": 0, "30": 0, all: 0 };
  for (const t of topics)
    for (const r of t.rows) {
      if (r.id === null) continue;
      for (const w of ADDED_WINDOWS) if (rowInWindow(r, w.key, today)) out[w.key] += 1;
    }
  return out;
}

/** "Sep 12" — the day a search entered the bank, short enough for a row. */
export function formatAddedOn(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Where a row came from, in the words the tab uses. */
export function rowSourceLabel(source: string): string {
  if (source === "search_console") return "Search Console";
  if (source === "researched") return "Keyword Scout";
  if (source === "competitor_gap") return "Competitor gap";
  return "derived from your catalog";
}

/** The chip a row shows for its source (SPEC-292): a gap names whose it is. */
export function rowSourceChip(source: string, sourceRef: string | null): string {
  if (source === "competitor_gap") return sourceRef ? `Gap · ${sourceRef}` : "Competitor gap";
  if (source === "researched") return "Research angle";
  return querySourceLabel(source);
}

/* ── segments, filters, sort ─────────────────────────────────────────────── */

export type InboundFilter = "all" | "p2" | "gsc" | "unwritten" | "research" | "gaps" | "focus";

export const INBOUND_FILTERS: { key: InboundFilter; label: string }[] = [
  { key: "all", label: "All topics" },
  { key: "p2", label: "Page two" },
  { key: "gsc", label: "Google demand" },
  { key: "unwritten", label: "Not written" },
  { key: "research", label: "With research angles" },
  { key: "gaps", label: "Competitor gaps" },
  { key: "focus", label: "Today's focus" },
];

/** The filter a `?filter=` in the URL asks for, or the default (SPEC-292). */
export function initialInboundFilter(raw: string | null | undefined): InboundFilter {
  return INBOUND_FILTERS.some((f) => f.key === raw) ? (raw as InboundFilter) : "all";
}

export function matchesInboundFilter(t: InboundTopic, filter: InboundFilter): boolean {
  switch (filter) {
    case "p2":
      return t.potentialClicks > 0;
    case "gsc":
      return t.source === "search_console" || t.volume > 0;
    case "unwritten":
      return t.state === "none" && t.kind !== "brand";
    case "research":
      return t.angles > 0 || t.source === "researched" || t.source === "competitor_gap";
    case "gaps":
      return t.gapRefs.length > 0 || t.source === "competitor_gap";
    case "focus":
      return t.focus;
    default:
      return true;
  }
}

export function inboundFilterCounts(topics: InboundTopic[]): Record<InboundFilter, number> {
  // Every filter starts at 0 from the one list — a filter added to INBOUND_FILTERS
  // can never count NaN (SPEC-292 found "Competitor gaps NaN").
  const out = Object.fromEntries(INBOUND_FILTERS.map((f) => [f.key, 0])) as Record<InboundFilter, number>;
  for (const t of topics) for (const f of INBOUND_FILTERS) if (matchesInboundFilter(t, f.key)) out[f.key] += 1;
  return out;
}

export interface InboundQuery {
  filter: InboundFilter;
  intent: string | null;
  persona: string | null;
  text: string;
}

export const DEFAULT_INBOUND_QUERY: InboundQuery = { filter: "all", intent: null, persona: null, text: "" };

/** A topic matches when the segment, intent and persona agree and every search
 * token appears in its name, category, persona or one of its phrases. */
export function filterTopics(topics: InboundTopic[], q: InboundQuery): InboundTopic[] {
  const tokens = q.text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return topics.filter((t) => {
    if (!matchesInboundFilter(t, q.filter)) return false;
    if (q.intent && t.intent !== q.intent && !t.rows.some((r) => r.intent === q.intent)) return false;
    if (q.persona && t.persona !== q.persona && !t.rows.some((r) => r.persona === q.persona)) return false;
    if (tokens.length === 0) return true;
    const hay = `${t.cluster} ${t.category} ${t.persona} ${t.rows.map((r) => r.keyword).join(" ")}`.toLowerCase();
    return tokens.every((tok) => hay.includes(tok));
  });
}

export type InboundSort = "opportunity" | "demand" | "name" | "unwritten" | "newest";

export function sortTopics(topics: InboundTopic[], sort: InboundSort): InboundTopic[] {
  const rows = [...topics];
  const brandLast = (a: InboundTopic, b: InboundTopic) => Number(a.kind === "brand") - Number(b.kind === "brand");
  const opportunity = (a: InboundTopic, b: InboundTopic) =>
    b.potentialClicks - a.potentialClicks || b.volume - a.volume || Number(b.focus) - Number(a.focus) || a.cluster.localeCompare(b.cluster);
  switch (sort) {
    case "demand":
      return rows.sort((a, b) => brandLast(a, b) || b.volume - a.volume || opportunity(a, b));
    case "name":
      return rows.sort((a, b) => brandLast(a, b) || a.cluster.localeCompare(b.cluster));
    case "unwritten":
      return rows.sort((a, b) => brandLast(a, b) || Number(a.state !== "none") - Number(b.state !== "none") || opportunity(a, b));
    case "newest":
      return rows.sort((a, b) => brandLast(a, b) || (b.newestOn ?? "").localeCompare(a.newestOn ?? "") || b.newCount - a.newCount || opportunity(a, b));
    default:
      return rows.sort((a, b) => brandLast(a, b) || opportunity(a, b));
  }
}

/** Every persona named across the topics, most common first. */
export function topicPersonas(topics: InboundTopic[]): string[] {
  const counts = new Map<string, number>();
  for (const t of topics) for (const p of [t.persona, ...t.rows.map((r) => r.persona)]) if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([p]) => p);
}

/* ── words ──────────────────────────────────────────────────────────────── */

export const TOPIC_STATE_LABEL: Record<TopicState, string> = { none: "Not written", draft: "Draft in review", published: "Published" };

/** "#11.6 · page 2" · "#3.2 · page 1" · "#28 · page 3" · "not ranking". */
export function rankLabel(position: number | null): { text: string; tone: "p1" | "p2" | "far" | "none" } {
  if (position === null) return { text: "not ranking", tone: "none" };
  const page = Math.max(1, Math.ceil(position / 10));
  const text = `#${position % 1 === 0 ? position.toFixed(0) : position.toFixed(1)} · page ${page}`;
  return { text, tone: page === 1 ? "p1" : position <= 25 ? "p2" : "far" };
}

/** "~600" clicks a month, rounded to something a person can hold. */
export function formatClicks(clicks: number): string {
  if (clicks <= 0) return "—";
  if (clicks < 10) return `~${Math.round(clicks)}`;
  if (clicks < 100) return `~${Math.round(clicks / 5) * 5}`;
  const rounded = clicks < 1000 ? Math.round(clicks / 10) * 10 : Math.round(clicks / 100) * 100;
  return `~${rounded.toLocaleString("en-US")}`;
}

/** The topic's one action, from its state — none for the brand home: nobody
 * writes an article for people who already typed the store's name. */
export function topicAction(t: InboundTopic): { kind: "write" | "open" | "reach" | "none"; label: string } {
  if (t.kind === "brand") return { kind: "none", label: "" };
  if (t.state === "published") return { kind: "reach", label: "See reach" };
  if (t.state === "draft") return { kind: "open", label: "Open draft" };
  return { kind: "write", label: "Write this" };
}

/** The query to write against: the page-two winner (a bank row or the Search
 * Console line the backend added, `id === null`), else the biggest by volume. */
export function topicWriteRow(t: InboundTopic): InboundTopicRow | null {
  if (t.rows.length === 0) return null;
  const best = t.bestQuery ? t.rows.find((r) => r.keyword.toLowerCase() === t.bestQuery?.toLowerCase()) : undefined;
  return best ?? [...t.rows].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0];
}
