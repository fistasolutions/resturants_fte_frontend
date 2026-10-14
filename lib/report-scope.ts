/**
 * Report scope helpers (SPEC-033): the `scope` URL param is the single source
 * of truth for the brand/location tabs. Mirrors backend SPEC-026 validation.
 * Pure logic — unit-tested in tests/report-scope.test.ts.
 */

const SCOPE_PATTERN = /^(all|vendor:.{1,60}|location:\d{1,15})$/;

export function isValidScope(scope: string): boolean {
  return SCOPE_PATTERN.test(scope);
}

/** Normalize an incoming query param to a safe scope; junk becomes "all". */
export function normalizeScope(raw: string | undefined): string {
  if (!raw) return "all";
  const trimmed = raw.trim();
  return isValidScope(trimmed) ? trimmed : "all";
}

export function vendorScope(vendor: string): string {
  return `vendor:${vendor}`;
}

export function locationScope(id: number): string {
  return `location:${id}`;
}

/** Human label for a scope, resolving location ids via the scopes payload. */
export function scopeLabel(
  scope: string,
  locations: Array<{ id: number; name: string }>,
): string {
  if (scope === "all") return "All";
  if (scope.startsWith("vendor:")) return scope.slice("vendor:".length);
  const id = Number(scope.slice("location:".length));
  return locations.find((location) => location.id === id)?.name ?? `Location ${id}`;
}

/** Query string for a tab link, dropping defaults to keep URLs clean. */
export function scopeHref(date: string | null, scope: string): string {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (scope !== "all") params.set("scope", scope);
  const query = params.toString();
  return query ? `/reports?${query}` : "/reports";
}
