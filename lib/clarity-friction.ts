/**
 * The Website tab's list and page (SPEC-282) — the pure half, so Vitest reaches it.
 *
 * What Clarity records on a page, in the words a shop owner reads: one line per
 * issue with its count in proper English and the link into the store's own Clarity
 * project. Nothing here invents an issue Clarity did not send — the export carries
 * counts, not which script failed; the recordings do, and that is where each link goes.
 */

import { FRICTION_LABEL, frictionBand } from "@/lib/clarity";
import type { TableSpec } from "@/lib/table-controls";
import type { ClarityFrictionPage, ClarityLinks } from "@/types/clarity";

export type IssueKey = keyof Pick<
  ClarityFrictionPage,
  "rageClicks" | "deadClicks" | "scriptErrors" | "errorClicks" | "quickBacks" | "excessiveScroll"
>;

export interface IssueLine {
  key: IssueKey;
  /** Singular noun — "rage click"; `pluralise` makes the count read. */
  noun: string;
  count: number;
  /** In plain words: what this issue is and what it usually means. */
  meaning: string;
  /** True for the four issues the fix list counts as friction (SPEC-214). */
  counted: boolean;
  /** Where "Watch in Clarity" goes — null without a project id. */
  href: string | null;
}

const ISSUES: { key: IssueKey; noun: string; meaning: string; counted: boolean; link: keyof ClarityLinks }[] = [
  { key: "rageClicks", noun: "rage click", meaning: "Repeated clicks in one spot — something looked clickable and did nothing.", counted: true, link: "rageClicks" },
  { key: "deadClicks", noun: "dead click", meaning: "A click with no response — a UX bug or a broken element.", counted: true, link: "deadClicks" },
  { key: "scriptErrors", noun: "script error", meaning: "JavaScript failed on the page — a theme app or script broke; the recording shows which.", counted: true, link: "scriptErrors" },
  { key: "errorClicks", noun: "error click", meaning: "A click that triggered a JavaScript error.", counted: true, link: "errorClicks" },
  { key: "quickBacks", noun: "quick-back", meaning: "The visitor left the page within seconds and went back.", counted: false, link: "quickBacks" },
  { key: "excessiveScroll", noun: "excessive scroll", meaning: "Scrolled far faster than reading — lost on the page.", counted: false, link: "recordings" },
];

/** "1 script error" · "3 dead clicks" · "702 quick-backs". */
export function pluralise(count: number, noun: string): string {
  const n = count.toLocaleString("en-US");
  return count === 1 ? `${n} ${noun}` : `${n} ${noun}s`;
}

/** Every issue Clarity recorded on the page (count > 0), counted ones first,
 * largest first within each group. */
export function issueLines(page: ClarityFrictionPage): IssueLine[] {
  return ISSUES.filter((i) => page[i.key] > 0)
    .map((i) => ({
      key: i.key,
      noun: i.noun,
      count: page[i.key],
      meaning: i.meaning,
      counted: i.counted,
      href: page.clarity ? page.clarity[i.link] : null,
    }))
    .sort((a, b) => Number(b.counted) - Number(a.counted) || b.count - a.count);
}

/** The short line on a closed row — "1 script error · 3 dead clicks". */
export function issueSummary(page: ClarityFrictionPage): string {
  const lines = issueLines(page).filter((l) => l.counted);
  return lines.map((l) => pluralise(l.count, l.noun)).join(" · ") || "No friction recorded";
}

/** Friction events per 100 sessions, one decimal; 0 when there were no sessions. */
export function frictionRate(page: Pick<ClarityFrictionPage, "frictionEvents" | "sessions">): number {
  if (page.sessions <= 0) return 0;
  return Math.round((page.frictionEvents / page.sessions) * 1000) / 10;
}

/** The list's search / severity chips / pages (SPEC-258's controls). */
export const FRICTION_TABLE: TableSpec<ClarityFrictionPage> = {
  search: (p) => [p.title, p.path, p.handle],
  facet: (p) => FRICTION_LABEL[frictionBand(p.frictionEvents, p.sessions)],
  pageSize: 10,
};

export const WEBSITE_ROOT = "/traffic/website";

export function frictionPageHref(handle: string): string {
  return `${WEBSITE_ROOT}/${encodeURIComponent(handle)}`;
}

/** The Brief's line for a page that broke (SPEC-284): the issues in words, then
 * why it is listed — "started Sep 20; none the week before" or "up 3× on the week". */
export function brokeLine(page: { reason: "new" | "up"; priorDailyAvg: number; frictionEvents: number; sessions: number } & ClarityFrictionPage, capturedOn: string | null, formatDate: (iso: string) => string): string {
  const issues = issueSummary(page);
  const on = `${issues} on ${pluralise(page.sessions, "session")}`;
  if (page.reason === "new") {
    return `${on} — started ${capturedOn ? formatDate(capturedOn) : "yesterday"}; none the week before.`;
  }
  const factor = page.priorDailyAvg > 0 ? Math.round((page.frictionEvents / page.priorDailyAvg) * 10) / 10 : 0;
  return `${on} — up ${factor}× on the week's daily average of ${page.priorDailyAvg}.`;
}

export function brokeChip(page: { reason: "new" | "up"; priorDailyAvg: number; frictionEvents: number }): string {
  if (page.reason === "new") return "new yesterday";
  const factor = page.priorDailyAvg > 0 ? Math.round(page.frictionEvents / page.priorDailyAvg) : 0;
  return factor > 1 ? `up ${factor}×` : "up";
}

