"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False only while React hydrates a server render; true on every client render after,
 * and on client-side navigation from the first frame.
 *
 * A view fed by a streamed prefetch (SPEC-230) renders its skeleton on the server. If the
 * data lands in the browser before hydration, the first client render would show data
 * where the server drew a skeleton — a hydration mismatch (React #418). Rendering the
 * skeleton until hydrated keeps the two identical; a revisit, which is not a hydration,
 * still paints straight from the cache.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
