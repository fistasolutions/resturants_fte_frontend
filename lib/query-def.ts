/**
 * One loader, two transports (SPEC-230).
 *
 * A page's data is *defined* once as a `QueryDef`: a cache key plus a `load` that is
 * handed whichever GET transport is available where it runs — `serverApi` inside the
 * Server Component that prefetches, `clientApi` inside the Client Component that
 * refetches. Path building, adaptation and composition therefore exist in exactly one
 * place (`lib/queries/<domain>.ts`), and that place is pure enough to unit-test with a
 * fake `api` in Vitest's node environment.
 */

/** A GET that resolves the parsed JSON body of `path` and throws `ApiError` otherwise. */
export type ApiGet = <T>(path: string) => Promise<T>;

export interface QueryDef<T> {
  /**
   * TanStack Query key. Must include every input that changes the answer (store scope
   * is implicit — one store in V1 — but any date range, page, filter or compare mode
   * is not), and must be JSON-serialisable so the same key hashes identically on the
   * server and in the browser.
   */
  readonly queryKey: readonly unknown[];
  /** Fetch + adapt the view model through whichever transport the caller has. */
  readonly load: (api: ApiGet) => Promise<T>;
}

export function defineQuery<T>(
  queryKey: readonly unknown[],
  load: (api: ApiGet) => Promise<T>,
): QueryDef<T> {
  return { queryKey, load };
}
