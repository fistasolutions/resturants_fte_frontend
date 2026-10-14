"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";

/**
 * Mounts the session-long client data cache (SPEC-230).
 *
 * Rendered once from `app/(app)/layout.tsx`, which Next does not re-render on
 * client-side navigation — that is what lets the cache outlive every page. The client
 * is fetched, not created in `useState`, on purpose: React discards state from an
 * initial render that suspends without a boundary above it, and a page below this
 * provider may well suspend.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
  );
}
