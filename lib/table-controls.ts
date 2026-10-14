/**
 * In-place controls for a fully loaded analysis table (SPEC-258): a token search
 * over named fields, one facet (the verdict / gap / fix column), and client-side
 * pages. Pure, so the "which rows are visible" logic is unit-tested and the table
 * component only holds three pieces of state.
 */

import { clampPage, pageCount, paginate } from "@/lib/catalog-pagination";

export const TABLE_PAGE_SIZE = 15;

/** Bare row → strings so the row set can be searched and faceted. */
export interface TableSpec<T> {
  /** The fields a typed query is matched against. */
  search: (row: T) => string[];
  /** The one label a chip row is built from — a verdict, a gap, a fix. */
  facet: (row: T) => string;
  pageSize?: number;
}

export interface TableControls {
  query: string;
  /** `null` is "All". */
  facet: string | null;
  page: number;
}

export const DEFAULT_TABLE_CONTROLS: TableControls = { query: "", facet: null, page: 1 };

export interface FacetOption {
  label: string;
  count: number;
}

export interface TableSlice<T> {
  rows: T[];
  /** Rows after the query and facet, before paging. */
  matches: number;
  /** Rows before any control. */
  total: number;
  /** The requested page, clamped into range. */
  page: number;
  pages: number;
  pageSize: number;
}

function tokens(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Every token of `query` appears, case-insensitively, in at least one field. */
export function matchesQuery(fields: string[], query: string): boolean {
  const needles = tokens(query);
  if (needles.length === 0) return true;
  const haystack = fields.map((f) => f.toLowerCase());
  return needles.every((needle) => haystack.some((field) => field.includes(needle)));
}

/** Distinct facet labels with counts — most common first, ties by label. */
export function facetOptions<T>(rows: T[], facetOf: (row: T) => string): FacetOption[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = facetOf(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function isDefaultControls(controls: TableControls): boolean {
  return controls.query.trim() === "" && controls.facet === null;
}

/** Filter, then clamp the page to what is left, then slice. */
export function applyControls<T>(rows: T[], controls: TableControls, spec: TableSpec<T>): TableSlice<T> {
  const pageSize = spec.pageSize ?? TABLE_PAGE_SIZE;
  const filtered = rows.filter(
    (row) =>
      (controls.facet === null || spec.facet(row) === controls.facet) &&
      matchesQuery(spec.search(row), controls.query),
  );
  const page = clampPage(controls.page, filtered.length, pageSize);
  return {
    rows: paginate(filtered, page, pageSize),
    matches: filtered.length,
    total: rows.length,
    page,
    pages: pageCount(filtered.length, pageSize),
    pageSize,
  };
}

/** A page-number entry for the pager: a page, or a gap. */
export type PageEntry = number | "…";

/**
 * Which page numbers the pager shows. Up to seven pages are all shown; past that,
 * the first, the last and the current ±1, with a gap marker where pages are skipped —
 * so a 14-page table still fits on one row.
 */
export function pageWindow(page: number, pages: number): PageEntry[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const around = new Set<number>([1, pages, page - 1, page, page + 1]);
  // Keep the row the same width near either edge: 1 2 3 4 … 14 and 1 … 11 12 13 14.
  if (page <= 3) [2, 3, 4].forEach((n) => around.add(n));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((n) => around.add(n));
  const shown = [...around].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: PageEntry[] = [];
  let last = 0;
  for (const n of shown) {
    // A gap that would hide exactly one page shows the page instead.
    if (n - last === 2) out.push(last + 1);
    else if (n - last > 2) out.push("…");
    out.push(n);
    last = n;
  }
  return out;
}

/** "16–30 of 137" for the pager's caption. */
export function pageRange(slice: Pick<TableSlice<unknown>, "page" | "pageSize" | "matches">): [number, number] {
  if (slice.matches === 0) return [0, 0];
  const first = (slice.page - 1) * slice.pageSize + 1;
  return [first, Math.min(slice.page * slice.pageSize, slice.matches)];
}
