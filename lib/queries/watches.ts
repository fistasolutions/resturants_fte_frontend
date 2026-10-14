/** The watchlist (SPEC-262): one read, through the client cache. */
import { defineQuery } from "@/lib/query-def";
import { toWatchList, type ApiWatchList } from "@/lib/watch-adapter";
import type { WatchList } from "@/types/watch";

export const watchPaths = {
  list: (): string => "/watches",
} as const;

export const watchQueries = {
  list: () =>
    defineQuery<WatchList>(["watches"], async (api) =>
      toWatchList(await api<ApiWatchList>(watchPaths.list())),
    ),
} as const;
