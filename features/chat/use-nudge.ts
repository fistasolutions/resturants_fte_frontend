"use client";

import { useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useOptionalChatDrawer } from "@/features/chat/chat-drawer-provider";
import { useApiQuery } from "@/hooks/use-api-query";
import { pageContextFor } from "@/lib/chat-context";
import { dismissNudge, isDismissed, nudgeContext, nudgeRouteFor } from "@/lib/nudge";
import { nudgeQueries } from "@/lib/queries/nudge";
import type { Nudge } from "@/types/nudge";
import { dateToISO } from "@/utils/date";

/** A nudge is a hint, not a live metric — the backend keeps each page's answer ten
 * minutes (SPEC-254); asking more often than that is wasted. */
const NUDGE_STALE_MS = 10 * 60_000;

// Dismissals live in localStorage; this tiny store lets every reader re-render
// the moment one is recorded, without a context or a prop chain.
const listeners = new Set<() => void>();
let version = 0;
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function bump(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

export interface PageNudge {
  /** The live nudge for this page, or null — none, dismissed, still loading. */
  nudge: Nudge | null;
  /** Send its question into the drawer's thread and put it away. */
  explain: () => void;
  /** Put it away until the figure changes. */
  dismiss: () => void;
}

/**
 * The current page's nudge (SPEC-246): fetched once per page family through the
 * client cache, hidden once dismissed, and wired to the drawer's `ask`.
 */
export function usePageNudge(): PageNudge {
  const drawer = useOptionalChatDrawer();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = drawer && !drawer.suppressed ? nudgeRouteFor(pathname) : null;
  const query = useApiQuery(route ? nudgeQueries.forRoute(route) : null, {
    staleTime: NUDGE_STALE_MS,
  });
  // Re-read dismissals when one is recorded (and never on the server).
  const dismissedVersion = useSyncExternalStore(subscribe, () => version, () => -1);
  const candidate = query.data ?? null;
  const nudge =
    candidate && dismissedVersion >= 0 && !isDismissed(candidate.id) ? candidate : null;

  function dismiss() {
    if (!nudge) return;
    dismissNudge(nudge.id);
    bump();
  }

  function explain() {
    if (!nudge || !drawer) return;
    const context = pageContextFor(pathname, searchParams, dateToISO(new Date()));
    drawer.ask(nudge.question, nudgeContext(context, nudge));
    dismiss();
  }

  return { nudge, explain, dismiss };
}
