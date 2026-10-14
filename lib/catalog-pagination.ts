/** Client-side pagination for the catalog table (SPEC-105). Pure helpers so the
 * "which products are visible" logic is unit-testable and the component stays
 * thin. The AI verdict fetch is driven off the visible slice only. */

export const CATALOG_PAGE_SIZE = 10;

/** Total number of pages for `total` rows (never below 1, so an empty catalog
 * still reads as "Page 1 of 1"). */
export function pageCount(total: number, size: number = CATALOG_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/** The rows visible on `page` (1-indexed). Out-of-range pages return an empty
 * slice — callers clamp first with `clampPage`. */
export function paginate<T>(rows: T[], page: number, size: number = CATALOG_PAGE_SIZE): T[] {
  const start = (page - 1) * size;
  return rows.slice(start, start + size);
}

/** Clamp a page number into [1, pageCount] so state can never point past the
 * last page (e.g. after the row set shrinks). */
export function clampPage(page: number, total: number, size: number = CATALOG_PAGE_SIZE): number {
  const max = pageCount(total, size);
  if (page < 1) return 1;
  if (page > max) return max;
  return page;
}
