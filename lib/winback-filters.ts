/**
 * URL-param parsing + link building for the winback review page
 * (SPEC-053, backend SPEC-047). Pure and unit-tested — mirrors
 * `lib/order-filters.ts` at a smaller scale.
 */

export interface WinbackFilters {
  q: string;
  page: number;
  /** Minimum lifetime spend, or null when not filtering. */
  minSpend: number | null;
  /** Minimum days silent, or null when not filtering. */
  minSilent: number | null;
}

function parsePositiveNumber(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseWinbackFilters(
  params: Record<string, string | undefined>,
): WinbackFilters {
  return {
    q: (params.q ?? "").trim().slice(0, 80),
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
    minSpend: parsePositiveNumber(params.min_spend),
    minSilent: parsePositiveNumber(params.min_silent),
  };
}

export function winbackPageHref(filters: Partial<WinbackFilters>, page = 1): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.minSpend) params.set("min_spend", String(filters.minSpend));
  if (filters.minSilent) params.set("min_silent", String(filters.minSilent));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/customers/winback?${query}` : "/customers/winback";
}
