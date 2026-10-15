"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { clientApi } from "@/lib/client-api";
import type { QueryDef } from "@/lib/query-def";

/** A public page's read (SPEC-379): the same `QueryDef` as anywhere, through the proxy without a
 * session, and without the signed-in app's workspace hooks. */
export function usePublicQuery<T>(
  def: QueryDef<T> | null,
  refetchInterval?: number | ((data: T | undefined) => number),
): UseQueryResult<T, Error> {
  return useQuery({
    queryKey: def ? def.queryKey : ["__skipped__"],
    queryFn: () => (def as QueryDef<T>).load(clientApi),
    enabled: def !== null,
    refetchInterval: typeof refetchInterval === "function" ? (query) => refetchInterval(query.state.data as T | undefined) : refetchInterval,
    retry: 1,
  });
}
