/**
 * URL-param parsing + link building for the Customers / Money Finder page
 * (SPEC-056, backend SPEC-049). Pure and unit-tested — mirrors
 * `lib/winback-filters.ts` (search + page only).
 */

export interface CustomersFilters {
  q: string;
  page: number;
}

export function parseCustomersFilters(
  params: Record<string, string | undefined>,
): CustomersFilters {
  return {
    q: (params.q ?? "").trim().slice(0, 80),
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  };
}

export function customersPageHref(filters: Partial<CustomersFilters>, page = 1): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/customers?${query}` : "/customers";
}
