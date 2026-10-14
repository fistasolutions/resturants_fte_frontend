/**
 * Spotlight › Published › Worth rewriting — the pure half (frontend SPEC-305,
 * backend SPEC-302). Adapters, wording and ordering; no fetch, no React, so Vitest
 * covers the judgement the screen renders.
 *
 * Every figure here comes from the backend: the band, the potential clicks and the
 * ranking are decided once, in `services/spotlight/refresh.py`. This file turns them
 * into sentences and never into different numbers (root Rule 8).
 */

import { formatNumber } from "@/utils/format";

/** The band a rewrite can realistically carry a page out of (backend SPEC-302). */
export const REFRESH_BAND = { min: 8, max: 20 } as const;

export interface MissedSearch {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  /** Clicks a month a move onto the fold would add — the backend's number. */
  potentialClicks: number;
}

export interface RefreshPost {
  draftId: number;
  title: string;
  url: string | null;
  targetKeyword: string;
  potentialClicks: number;
  missedCount: number;
  topMissed: MissedSearch[];
}

export interface RefreshData {
  /** The last day of the Search Console window the rows describe; null before a scan. */
  windowEnd: string | null;
  published: number;
  scanned: number;
  potentialClicks: number;
  posts: RefreshPost[];
}

interface ApiMissed {
  query?: string;
  position?: number;
  impressions?: number;
  clicks?: number;
  potential_clicks?: number;
}

interface ApiRefreshPost {
  draft_id?: number;
  title?: string;
  url?: string | null;
  target_keyword?: string;
  potential_clicks?: number;
  missed_count?: number;
  top_missed?: ApiMissed[];
}

export interface ApiRefresh {
  window_end?: string | null;
  published?: number;
  scanned?: number;
  potential_clicks?: number;
  posts?: ApiRefreshPost[];
}

const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

function adaptMissed(raw: ApiMissed): MissedSearch {
  return {
    query: typeof raw.query === "string" ? raw.query : "",
    position: num(raw.position),
    impressions: num(raw.impressions),
    clicks: num(raw.clicks),
    potentialClicks: num(raw.potential_clicks),
  };
}

export function adaptRefreshPost(raw: ApiRefreshPost): RefreshPost {
  return {
    draftId: num(raw.draft_id),
    title: typeof raw.title === "string" ? raw.title : "",
    url: typeof raw.url === "string" ? raw.url : null,
    targetKeyword: typeof raw.target_keyword === "string" ? raw.target_keyword : "",
    potentialClicks: num(raw.potential_clicks),
    missedCount: num(raw.missed_count),
    topMissed: (raw.top_missed ?? []).map(adaptMissed),
  };
}

export function adaptRefresh(raw: ApiRefresh): RefreshData {
  return {
    windowEnd: typeof raw.window_end === "string" ? raw.window_end : null,
    published: num(raw.published),
    scanned: num(raw.scanned),
    potentialClicks: num(raw.potential_clicks),
    posts: (raw.posts ?? []).map(adaptRefreshPost),
  };
}

/** "4 of 12 published posts are ranking for searches they were never written for —
 * about 180 more clicks a month between them." Plain, and never a promise: "about". */
export function refreshSummary(data: RefreshData): string {
  if (data.posts.length === 0) return "";
  const noun = data.published === 1 ? "published post is" : "published posts are";
  return (
    `${formatNumber(data.posts.length)} of ${formatNumber(data.published)} ${noun} ranking for ` +
    `searches they were never written for — about ${formatNumber(Math.round(data.potentialClicks))} ` +
    `more ${data.potentialClicks < 1.5 ? "click" : "clicks"} a month between them.`
  );
}

/** "position 14 · 3,000 impressions · about 21 more clicks a month" */
export function missedLine(missed: MissedSearch): string {
  const clicks = Math.round(missed.potentialClicks);
  return (
    `position ${missed.position.toFixed(1)} · ${formatNumber(missed.impressions)} impressions · ` +
    `about ${formatNumber(clicks)} more ${clicks === 1 ? "click" : "clicks"} a month`
  );
}

/** Where this post sits: page one's bottom half, or page two. */
export function bandLabel(position: number): string {
  return position <= 10 ? "bottom of page one" : "page two";
}

/** "Scanned Sep 22" — when the rows were last read, or the reason there are none. */
export function windowLabel(data: RefreshData): string {
  if (!data.windowEnd) return "Not scanned yet — the scan runs Monday.";
  const when = new Date(`${data.windowEnd}T00:00:00Z`);
  if (Number.isNaN(when.getTime())) return "";
  return `Last 28 days, read ${when.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
}
