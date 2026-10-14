"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, RefreshCw } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  canSyncNow,
  clarityBudgetLine,
  claritySyncPollInterval,
  claritySyncProgress,
  describeClaritySync,
  type ClaritySyncTone,
} from "@/lib/clarity-sync";
import { clarityQueries } from "@/lib/queries/clarity";
import { cn } from "@/lib/utils";
import { syncClarityNow } from "@/services/clarity-actions";
import { formatDate, formatDateTime } from "@/utils/format";

const TONE_TEXT: Record<ClaritySyncTone, string> = {
  running: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

/**
 * The sync state under the Clarity card's fields (SPEC-270; backend SPEC-270):
 * the run the save started, its progress, the named outcome, the daily API
 * budget, and Sync now / Retry. Polls the status only while a run is in flight.
 */
export function ClaritySyncPanel() {
  const queryClient = useQueryClient();
  const query = useApiQuery(clarityQueries.status(), {
    refetchInterval: (q) => claritySyncPollInterval(q.state.data?.sync),
  });
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (query.isPending || query.isError || !query.data.configured) return null;
  const status = query.data;
  const sync = status.sync;
  const described = describeClaritySync(sync, status.capturedOn);
  const running = sync?.state === "running";
  const progress = claritySyncProgress(sync);

  async function handleSync() {
    setStarting(true);
    setError(null);
    try {
      const next = await syncClarityNow();
      queryClient.setQueryData(clarityQueries.status().queryKey, next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the sync. Try again.");
      void queryClient.invalidateQueries({ queryKey: clarityQueries.status().queryKey });
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      {running ? (
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-foreground">{described?.headline ?? "Syncing"}</span>
            <span className="text-muted-foreground">{progress.label}</span>
          </div>
          <div
            role="progressbar"
            aria-label="Clarity sync progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent ?? undefined}
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-[width] duration-200",
                progress.percent === null && "w-1/3 animate-pulse",
              )}
              style={progress.percent === null ? undefined : { width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{described?.detail}</p>
        </div>
      ) : described ? (
        <div className="space-y-0.5 text-xs">
          <p className={cn("font-medium", TONE_TEXT[described.tone])}>
            {described.headline}
            {sync?.finishedAt ? (
              <span className="font-normal text-muted-foreground">
                {" "}· {formatDateTime(sync.finishedAt)}
              </span>
            ) : null}
          </p>
          <p className="text-muted-foreground">{described.detail}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Not synced yet — the nightly pull runs at {status.nextRunUtc} UTC, or use Sync now.
        </p>
      )}

      {status.capturedOn && !running ? (
        <p className="text-[11px] text-muted-foreground">
          Last captured day {formatDate(status.capturedOn)} · next {status.nextRunUtc} UTC
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <RoleButton
          need="traffic.manage"
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={starting || !canSyncNow(sync, status.budget)}
          aria-label={sync?.state === "error" ? "Retry Clarity sync" : "Sync Clarity now"}
        >
          {starting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          {sync?.state === "error" ? "Retry" : "Sync now"}
        </RoleButton>
        <span className="text-[11px] text-muted-foreground">{clarityBudgetLine(status.budget)}</span>
      </div>
    </div>
  );
}
