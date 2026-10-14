/**
 * The page's own search params as a query string (SPEC-230) — the serialisable form
 * a Server Component hands its client view, which rebuilds `URLSearchParams` from it
 * (a `URLSearchParams` instance cannot cross the server → client boundary).
 */
export function paramsQueryString(params: Record<string, string | undefined>): string {
  return new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ).toString();
}
