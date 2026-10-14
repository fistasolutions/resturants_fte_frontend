"use client";

import {
  skipToken,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import { useLocaleDiffers } from "@/features/workspace/workspace-provider";
import { useHydrated } from "@/hooks/use-hydrated";
import { clientApi } from "@/lib/client-api";
import type { QueryDef } from "@/lib/query-def";

/** Everything `useQuery` accepts except the two fields the `QueryDef` already fixes. */
export type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

/** The key a skipped (null-definition) query parks under; never fetched. */
const SKIPPED_KEY = ["__skipped__"] as const;

/**
 * Read a `QueryDef` from the client cache (SPEC-230).
 *
 * The browser transport is always `clientApi` (`/api/proxy`), so the same definition
 * the page prefetched with `serverApi` is refetched here with the same key and the
 * same adapter. If the page's prefetch was streamed, this never fetches on first
 * mount — it just observes the promise already in the cache.
 *
 * Pass `null` for a query that depends on another one's answer and cannot be built
 * yet (e.g. a report for "the latest date" before the list has arrived): the hook
 * parks on TanStack's `skipToken`, stays `isPending` with `fetchStatus: "idle"`, and
 * fetches nothing. Hooks stay unconditional; the dependency stays type-safe.
 */
export function useApiQuery<T>(
  def: QueryDef<T> | null,
  options?: ApiQueryOptions<T>,
): UseQueryResult<T, Error> {
  const result = useQuery({
    ...options,
    queryKey: def ? def.queryKey : SKIPPED_KEY,
    queryFn: def ? () => def.load(clientApi) : skipToken,
  });
  // SPEC-319: a server render formats in the default currency and zone. For a store that
  // formats otherwise, data must not reach the hydration render — both sides draw the pending
  // state, and the data appears in the store's own format one render later. A client-side
  // navigation is not a hydration, and a default-locale store is never masked.
  const localeDiffers = useLocaleDiffers();
  const hydrated = useHydrated();
  if (localeDiffers && !hydrated && result.data !== undefined) {
    return pendingDuringHydration(result);
  }
  return result;
}

/** The same query, reported as still loading. */
function pendingDuringHydration<T>(result: UseQueryResult<T, Error>): UseQueryResult<T, Error> {
  return {
    ...result,
    data: undefined,
    error: null,
    status: "pending",
    isPending: true,
    isLoading: true,
    isSuccess: false,
    isError: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    isFetched: false,
    isFetchedAfterMount: false,
  } as UseQueryResult<T, Error>;
}
