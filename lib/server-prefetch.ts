/**
 * Server-side prefetch into the client cache (SPEC-230).
 *
 * A page's Server Component calls this for each query it needs and then renders
 * `<HydrationBoundary state={dehydrate(queryClient)}>` around its client view. The
 * prefetch is deliberately **not awaited**: the fetch starts now, the page renders
 * immediately, and the pending promise is streamed to the browser inside the RSC
 * payload. First visit: the view shows its skeleton until the promise lands. Revisit:
 * the view paints the cached answer at once and this promise refreshes it behind.
 */
import "server-only";

import type { QueryClient } from "@tanstack/react-query";

import { serverApi } from "@/lib/api";
import type { QueryDef } from "@/lib/query-def";

export function prefetch<T>(queryClient: QueryClient, def: QueryDef<T>): void {
  void queryClient.prefetchQuery({
    queryKey: def.queryKey,
    queryFn: () => def.load(serverApi),
    // Fail fast on the server: a failed prefetch rejects the streamed promise and the
    // browser retries once through `/api/proxy` (see `makeQueryClient`). A server-side
    // retry here would only hold the stream open for its back-off delay.
    retry: 0,
  });
}
