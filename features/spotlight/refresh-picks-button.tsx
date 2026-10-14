"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { spotlightQueries } from "@/lib/queries/spotlight";
import { refreshDailyPicks } from "@/services/spotlight-actions";

/** Regenerate today's Daily Picks on demand (SPEC-155). The rebuild re-scores the
 * clusters and re-runs the research agent, so it takes a few seconds — the button
 * stays disabled with a spinning icon until the server confirms. A failure
 * surfaces inline and leaves the existing picks in place.
 *
 * The tab reads today's snapshot from the client cache (SPEC-230), so the fresh
 * snapshot the endpoint returns is written straight into that cache — the list and
 * its "Generated …" stamp update the moment the server answers, with no second
 * request. (`router.refresh()` alone re-ran the server route but never touched the
 * cache the tab renders from, so the new picks were silently discarded — SPEC-157
 * Patches, 2026-09-14.) The history dropdown is invalidated so today's row shows
 * the new generation time. */
export function RefreshPicksButton() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setBusy(true);
    setError(null);
    try {
      const snapshot = await refreshDailyPicks();
      queryClient.setQueryData(spotlightQueries.dailyPicks().queryKey, snapshot);
      void queryClient.invalidateQueries({
        queryKey: spotlightQueries.dailyPicksHistory().queryKey,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't refresh picks.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <RoleButton
        need="spotlight.manage"
        size="sm"
        variant="outline"
        onClick={handleRefresh}
        disabled={busy}
        aria-live="polite"
      >
        <RefreshCw
          className={busy ? "size-3.5 animate-spin" : "size-3.5"}
          aria-hidden
        />
        <span className="whitespace-nowrap">
          {busy ? "Refreshing…" : "Refresh picks"}
        </span>
      </RoleButton>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
