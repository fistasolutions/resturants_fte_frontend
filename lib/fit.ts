/**
 * The Fit tab's page logic (SPEC-306) — pure, so Vitest holds it still.
 *
 * Everything here narrows, orders or words figures the backend computed (SPEC-303); it
 * never decides a verdict. The view lives in the URL: `verdict`, `vendor`, `q`, `sort`,
 * `dir`, `page`.
 */
import type { StatusTone } from "@/components/shared/status-badge";
import type { FitStyle, FitStyleDetail, FitVerdict } from "@/types/fit";

export const FIT_ROOT = "/products/fit";
export const FIT_PAGE_SIZE = 25;

export interface VerdictMeta {
  label: string;
  tone: StatusTone;
  /** What the owner should do about a style with this verdict. */
  action: string;
}

export const VERDICT_META: Record<FitVerdict, VerdictMeta> = {
  runs_small: { label: "Runs small", tone: "warning", action: "Tell customers to size up" },
  runs_large: { label: "Runs large", tone: "info", action: "Tell customers to size down" },
  inconsistent: { label: "Fit varies", tone: "destructive", action: "Check the size chart with the vendor" },
  true_to_size: { label: "True to size", tone: "success", action: "Say so on the page" },
  not_enough: { label: "Not enough data", tone: "neutral", action: "Wait for more returns" },
};

export const CONFIDENCE_LABEL = { high: "High", medium: "Medium", low: "Low" } as const;

/** The verdict chips, in reading order. "judged" = every style with a verdict. */
export type VerdictFilter = "judged" | FitVerdict | "all";
export const VERDICT_FILTERS: VerdictFilter[] = [
  "judged",
  "runs_small",
  "runs_large",
  "inconsistent",
  "true_to_size",
  "not_enough",
  "all",
];

export function verdictFilterLabel(filter: VerdictFilter): string {
  if (filter === "judged") return "Has a verdict";
  if (filter === "all") return "All styles";
  return VERDICT_META[filter].label;
}

export function normalizeVerdictFilter(value: string | null | undefined): VerdictFilter {
  return VERDICT_FILTERS.includes(value as VerdictFilter) ? (value as VerdictFilter) : "judged";
}

export function countFor(styles: FitStyle[], filter: VerdictFilter): number {
  return styles.filter((s) => matchesVerdict(s, filter)).length;
}

function matchesVerdict(style: FitStyle, filter: VerdictFilter): boolean {
  if (filter === "all") return true;
  if (filter === "judged") return style.verdict !== "not_enough";
  return style.verdict === filter;
}

export type FitSortKey = "fitRefund" | "fitReturns" | "fitRate" | "lean" | "sold" | "title";
export const FIT_SORT_KEYS: FitSortKey[] = ["fitRefund", "fitReturns", "fitRate", "lean", "sold", "title"];

export interface FitView {
  verdict: VerdictFilter;
  vendor: string | null;
  q: string;
  sort: FitSortKey;
  dir: 1 | -1;
  page: number;
}

export const DEFAULT_VIEW: FitView = { verdict: "judged", vendor: null, q: "", sort: "fitRefund", dir: -1, page: 1 };

export function viewFromParams(params: URLSearchParams): FitView {
  const sort = params.get("sort");
  return {
    verdict: normalizeVerdictFilter(params.get("verdict")),
    vendor: params.get("vendor") || null,
    q: params.get("q") ?? "",
    sort: FIT_SORT_KEYS.includes(sort as FitSortKey) ? (sort as FitSortKey) : DEFAULT_VIEW.sort,
    dir: params.get("dir") === "asc" ? 1 : -1,
    page: Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1),
  };
}

/** The URL for a view; defaults are left out so the plain tab URL stays plain. */
export function fitHref(view: FitView): string {
  const params = new URLSearchParams();
  if (view.verdict !== DEFAULT_VIEW.verdict) params.set("verdict", view.verdict);
  if (view.vendor) params.set("vendor", view.vendor);
  if (view.q.trim()) params.set("q", view.q.trim());
  if (view.sort !== DEFAULT_VIEW.sort) params.set("sort", view.sort);
  if (view.dir === 1) params.set("dir", "asc");
  if (view.page > 1) params.set("page", String(view.page));
  const query = params.toString();
  return query ? `${FIT_ROOT}?${query}` : FIT_ROOT;
}

export function fitStyleHref(productId: number): string {
  return `${FIT_ROOT}/${productId}`;
}

/** Pressing the sorted column flips it; a new column starts at its natural order. */
export function sortedBy(view: FitView, key: FitSortKey): FitView {
  if (view.sort === key) return { ...view, dir: view.dir === 1 ? -1 : 1, page: 1 };
  return { ...view, sort: key, dir: key === "title" ? 1 : -1, page: 1 };
}

export function filterStyles(styles: FitStyle[], view: FitView): FitStyle[] {
  const q = view.q.trim().toLowerCase();
  return styles.filter(
    (s) =>
      matchesVerdict(s, view.verdict) &&
      (!view.vendor || s.vendorKey === view.vendor) &&
      (!q || s.title.toLowerCase().includes(q) || (s.vendor ?? "").toLowerCase().includes(q)),
  );
}

/** Stable sort; a missing figure always sinks to the bottom, whichever way. */
export function sortStyles(styles: FitStyle[], key: FitSortKey, dir: 1 | -1): FitStyle[] {
  return styles
    .map((style, index) => ({ style, index }))
    .sort((a, b) => {
      if (key === "title") return dir * a.style.title.localeCompare(b.style.title) || a.index - b.index;
      const av = a.style[key];
      const bv = b.style[key];
      if (av === null && bv === null) return a.index - b.index;
      if (av === null) return 1;
      if (bv === null) return -1;
      return dir * (av - bv) || a.index - b.index;
    })
    .map((entry) => entry.style);
}

export function pageOf<T>(rows: T[], page: number, size = FIT_PAGE_SIZE): { rows: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((current - 1) * size, current * size), page: current, pages };
}

/** The lean bar: how the fit returns split, as two percentages that add to 100. */
export function leanSplit(small: number, large: number): { small: number; large: number } | null {
  const total = small + large;
  if (!total) return null;
  const s = Math.round((small / total) * 100);
  return { small: s, large: 100 - s };
}

/** "since 21 May 2026" — what the verdicts rest on. */
export function coverageLabel(start: string | null): string {
  if (!start) return "no returns yet";
  const date = new Date(`${start}T00:00:00Z`);
  return `since ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`;
}

/**
 * The size guide as plain text, for pasting into the product page. Headline, the evidence,
 * then one line per size that earned its own advice. Nothing is written anywhere by us.
 */
export function guideText(detail: Pick<FitStyleDetail, "title" | "guide">): string {
  const lines = [`${detail.title} — ${detail.guide.headline}`, detail.guide.reason];
  if (detail.guide.sizes.length) {
    lines.push("", "By size:");
    for (const row of detail.guide.sizes) lines.push(`${row.size}: ${row.advice}`);
  }
  return lines.join("\n");
}
