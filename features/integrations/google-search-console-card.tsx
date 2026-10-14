"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, LoaderCircle, RefreshCw, Trash2, TriangleAlert } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GooglePropertyDialog } from "@/features/integrations/google-property-dialog";
import { useCan } from "@/hooks/use-can";
import { describeSync, propertyDisplay, syncProgress } from "@/lib/gsc-sync";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";
import {
  GoogleActionError,
  disconnectGoogle,
  getGoogleAuthorizeUrl,
  syncGoogleNow,
} from "@/services/google-actions";
import type { GoogleStatus } from "@/types/spotlight";
import { formatDateTime } from "@/utils/format";

interface GoogleSearchConsoleCardProps {
  status: GoogleStatus;
  /** True on the return from Google's consent screen — opens the property picker once. */
  openPicker?: boolean;
}

/**
 * Google Search Console connect card (backend SPEC-119; property choice + first sync
 * SPEC-250 / backend SPEC-257). States, driven by the cached status:
 *  - not configured → a "server not configured" note;
 *  - configured + not connected → Connect → consent → callback → `?google=choose`
 *    → this card opens the property picker;
 *  - connected, no property → "Action needed": Choose property, Disconnect;
 *  - connected + sync running → progress bar with pages done; status polls 2 s;
 *  - connected + synced / failed → last synced + rows (or the failure and Retry),
 *    Change property, Sync now, Disconnect.
 * Status writes come back from the actions and go straight into the cache.
 */
export function GoogleSearchConsoleCard({ status, openPicker = false }: GoogleSearchConsoleCardProps) {
  const queryClient = useQueryClient();
  const can = useCan();
  const gate = can("integrations.manage");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Open the picker on the return from Google, once per mount — and only while a
  // property is still missing, so a reload of `?google=choose` after choosing
  // does not reopen it.
  const [pickerOpen, setPickerOpen] = useState(
    () => openPicker && status.connected && status.needsProperty,
  );

  function replaceStatus(next: GoogleStatus) {
    queryClient.setQueryData(integrationQueries.googleStatus().queryKey, next);
  }

  const running = status.sync?.state === "running";
  const badge = !status.connected
    ? status.configured
      ? { label: "Not connected", className: "bg-warning/15 text-warning", icon: null }
      : { label: "Unavailable", className: "bg-muted text-muted-foreground", icon: null }
    : status.needsProperty
      ? { label: "Action needed", className: "bg-warning/15 text-warning", icon: TriangleAlert }
      : running
        ? { label: "Syncing", className: "bg-primary/10 text-primary", icon: LoaderCircle }
        : { label: "Connected", className: "bg-success/15 text-success", icon: Check };

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const url = await getGoogleAuthorizeUrl();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the Google connection.");
      setConnecting(false);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setError(null);
    try {
      replaceStatus(await syncGoogleNow());
    } catch (e) {
      if (e instanceof GoogleActionError && e.code === "google_sync_running") {
        setError("A sync is already running — the card updates as it goes.");
        void queryClient.invalidateQueries({ queryKey: integrationQueries.googleStatus().queryKey });
      } else {
        setError(e instanceof Error ? e.message : "Could not start the sync. Try again.");
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDisconnecting(true);
    setError(null);
    try {
      replaceStatus(await disconnectGoogle());
      setDialogOpen(false);
      setDisconnecting(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disconnect. Try again.");
      setDisconnecting(false);
    }
  }

  return (
    <Card className="gap-3 px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Google Search Console</p>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Organic reach
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.icon && (
            <badge.icon
              className={cn("size-3", badge.icon === LoaderCircle && "animate-spin")}
              aria-hidden
            />
          )}
          {badge.label}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Measured impressions, clicks, and average position for your published
        journal posts — powers the Visibility tab in Search Visibility.
      </p>

      {status.connected ? (
        <div className="space-y-3">
          <dl className="space-y-1 text-xs text-muted-foreground">
            {status.email && (
              <div className="flex gap-1.5">
                <dt className="font-medium text-foreground">Account</dt>
                <dd className="min-w-0 truncate">{status.email}</dd>
              </div>
            )}
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">Property</dt>
              <dd className="min-w-0 truncate">
                {status.propertyUrl ? propertyDisplay(status.propertyUrl).name : "Not chosen yet"}
              </dd>
            </div>
          </dl>

          {status.needsProperty ? (
            <p className="text-xs text-muted-foreground">
              Google is connected, but the platform doesn&apos;t know which Search Console
              property to read yet. Choose one and the first sync starts at once.
            </p>
          ) : (
            <SyncRow status={status} />
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {status.needsProperty ? (
              <RoleButton need="integrations.manage" size="sm" onClick={() => setPickerOpen(true)}>
                Choose property
              </RoleButton>
            ) : (
              <>
                <RoleButton
                  need="integrations.manage"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  disabled={running}
                >
                  Change property
                </RoleButton>
                <RoleButton
                  need="integrations.manage"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={running || syncing}
                  aria-label={status.sync?.state === "error" ? "Retry sync" : "Sync now"}
                >
                  {syncing ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden />
                  )}
                  {status.sync?.state === "error" ? "Retry" : "Sync now"}
                </RoleButton>
              </>
            )}

            <AlertDialog
              open={dialogOpen}
              onOpenChange={(next) => {
                if (disconnecting) return;
                setDialogOpen(next);
                if (!next) setError(null);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={!gate.allowed}
                  title={gate.reason ?? undefined}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Google Search Console?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The Visibility tab will fall back to its unconnected state and stop
                    receiving new reach data until you reconnect and choose a property again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
                    {disconnecting ? "Disconnecting…" : "Disconnect"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <GooglePropertyDialog
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            current={status.propertyUrl}
            onChosen={() => setError(null)}
          />
        </div>
      ) : status.configured ? (
        <div className="space-y-2">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <RoleButton need="integrations.manage" size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Redirecting…
              </>
            ) : (
              <>
                <ExternalLink className="size-4" aria-hidden />
                Connect Google Search Console
              </>
            )}
          </RoleButton>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Not available — Google Search Console isn&apos;t configured on the
          server yet.
        </p>
      )}
    </Card>
  );
}

/** The sync line: a progress bar while a pull runs, else the last result. */
function SyncRow({ status }: { status: GoogleStatus }) {
  const sync = status.sync;
  const described = describeSync(sync, status.lastPull);

  if (sync?.state === "running") {
    const progress = syncProgress(sync);
    return (
      <div className="space-y-1.5" aria-live="polite">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-foreground">{described?.headline ?? "Syncing"}</span>
          <span className="text-muted-foreground">{progress.label}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Search Console sync progress"
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
        <p className="text-[11px] text-muted-foreground">
          Pulling 28 days of search data for each published post. From tomorrow this runs
          nightly.
        </p>
      </div>
    );
  }

  if (!described) {
    return (
      <p className="text-xs text-muted-foreground">
        Not synced yet — the nightly pull runs at 04:00 UTC, or use Sync now.
      </p>
    );
  }

  return (
    <dl className="space-y-1 text-xs text-muted-foreground">
      <div className="flex gap-1.5">
        <dt className="font-medium text-foreground">{described.headline}</dt>
        <dd className={cn("min-w-0", described.tone === "error" && "text-destructive")}>
          {sync?.finishedAt ? formatDateTime(sync.finishedAt) : status.lastPull ?? ""}
          {described.detail ? ` · ${described.detail}` : ""}
        </dd>
      </div>
      <div className="flex gap-1.5">
        <dt className="font-medium text-foreground">Next</dt>
        <dd>Nightly at 04:00 UTC</dd>
      </div>
    </dl>
  );
}
