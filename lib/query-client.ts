/**
 * The client data cache (SPEC-230) — one `QueryClient`, one policy.
 *
 * Why the app felt slow: nothing remembered anything. Every page was a Server
 * Component that fetched from zero on every visit, so the second visit to Brief cost
 * exactly what the first did. This is the memory: a TanStack Query cache that lives for
 * the browser session, paints what it already knows in 0 ms, and refreshes behind it.
 *
 * Two clients exist on purpose:
 * - **Server** — a fresh client per render. A Server Component prefetches into it and
 *   dehydrates it into the RSC payload; it must never be shared between requests
 *   (it would leak one user's data into another's response).
 * - **Browser** — one singleton for the whole session. Mounted by `QueryProvider`
 *   inside `app/(app)/layout.tsx`, which is not re-rendered on client-side navigation,
 *   so the cache survives every sidebar click and dies only on a hard reload.
 */
import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

/**
 * How long a cached answer is considered fresh. A mount inside this window paints from
 * cache and does *not* start a client refetch — the Server Component's prefetch on
 * navigation is already refreshing it in the background.
 */
export const QUERY_STALE_TIME_MS = 60_000;

/** How long an unused answer is kept. Long enough for the morning walk through the app. */
export const QUERY_GC_TIME_MS = 30 * 60_000;

/**
 * The refresh policy for pages whose numbers track the 15-minute Shopify sync
 * (Dashboard — replaces SPEC-021's `<AutoRefresh />`): refetch every minute while the
 * tab is visible, pause while hidden, catch up when it is shown again.
 */
export const LIVE_QUERY_OPTIONS = {
  staleTime: 30_000,
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
} as const;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        // One retry through the proxy; the proxy itself already replays once on a
        // 401 (SPEC-149), so a second layer of retries would only add latency.
        retry: 1,
        // Deterministic traffic by default; live pages opt in via LIVE_QUERY_OPTIONS.
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        // The whole streaming mechanism: a *pending* prefetch is dehydrated with its
        // promise, which React streams to the browser as part of the RSC payload. The
        // page therefore never waits for data before rendering. Errors stay redacted
        // (the default) — a server-side failure must not carry backend detail into
        // the browser (Rule 6); the client retries through the proxy instead.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Fresh per render on the server; one singleton for the session in the browser. */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  return (browserQueryClient ??= makeQueryClient());
}
