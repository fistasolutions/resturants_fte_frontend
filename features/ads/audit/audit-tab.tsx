"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AccountPicker,
  ConnectMetaCard,
  DisconnectMetaAdsDialog,
  MetaAdsReturnNotice,
} from "@/features/ads/audit/audit-connect";
import { AdTable, CampaignTable, Findings, MoneyStrip } from "@/features/ads/audit/audit-report";
import { useApiQuery } from "@/hooks/use-api-query";
import { AUDIT_WINDOWS, connectionStage, normalizeWindow } from "@/lib/ad-platforms";
import { adsQueries } from "@/lib/queries/ads";
import { agoLabel } from "@/lib/trust-footer";
import { cn } from "@/lib/utils";
import { syncAdAccounts } from "@/services/ad-platforms-actions";

/**
 * Audit (SPEC-333 / backend SPEC-342): the store's real Meta ad accounts, read-only, and
 * what is wasting money in them. Four states — not configured, not connected, choose
 * accounts, connected — each with its own skeleton, empty and error lines.
 */
export function AuditTab() {
  const params = useSearchParams();
  const days = normalizeWindow(params.get("days"));
  const queryClient = useQueryClient();
  const status = useApiQuery(adsQueries.platforms());
  const stage = status.data ? connectionStage(status.data) : null;
  const connected = stage === "connected";
  const performance = useApiQuery(connected ? adsQueries.platformPerformance(days) : null);
  const audit = useApiQuery(connected ? adsQueries.platformAudit(days) : null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["ads"] });

  async function sync() {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await syncAdAccounts();
      setMessage(result.busy ? (result.message ?? "Already reading.") : (result.error ?? null));
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Reading failed.");
    }
    setSyncing(false);
  }

  if (status.isError) {
    return <p className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">We couldn&apos;t load the ad connection. Please retry in a moment.</p>;
  }
  if (!status.data) return <Skeleton className="h-48 rounded-card" />;

  const meta = status.data.platforms.find((p) => p.platform === "meta");

  return (
    <div className="space-y-4">
      <MetaAdsReturnNotice value={params.get("meta")} reason={params.get("reason")} />

      {(stage === "disconnected" || stage === "unconfigured") && <ConnectMetaCard configured={stage === "disconnected"} />}
      {stage === "choose" && meta && (
        <AccountPicker
          key={meta.accounts.map((a) => `${a.id}:${a.selected}`).join(",")}
          accounts={meta.accounts}
          onSaved={async () => {
            await refresh();
            void sync();
          }}
        />
      )}

      {connected && meta && (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-3 py-2 text-xs">
            <span className={cn("size-1.5 rounded-full", meta.status === "connected" ? "bg-success" : "bg-destructive")} aria-hidden />
            <span className="font-medium">Meta Ads</span>
            <span className="text-muted-foreground">
              {meta.accounts.filter((a) => a.selected).map((a) => a.name).join(", ")}
              {meta.lastSyncedAt ? ` · read ${agoLabel(meta.lastSyncedAt)}` : " · first read running"} · reads every 3 hours · read-only
            </span>
            <nav aria-label="Window" className="ml-auto flex gap-1">
              {AUDIT_WINDOWS.map((w) => (
                <Link
                  key={w}
                  href={`/ads?tab=audit&days=${w}`}
                  aria-current={w === days ? "page" : undefined}
                  className={cn(
                    "rounded-full border border-border px-2.5 py-0.5 font-semibold text-muted-foreground hover:text-foreground",
                    w === days && "border-foreground text-foreground",
                  )}
                >
                  {w} days
                </Link>
              ))}
            </nav>
            <RoleButton
              need="ads.manage"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => void sync()}
              disabled={syncing}
            >
              <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} aria-hidden />
              {syncing ? "Reading…" : "Sync now"}
            </RoleButton>
            <RoleGate need={["ads.manage", "integrations.manage"]}>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setConfirm(true)}>
                Disconnect
              </Button>
            </RoleGate>
          </div>
          {(meta.lastError || message) && (
            <p role="alert" className="rounded-xl border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
              {message ?? meta.lastError}
            </p>
          )}

          {performance.isError || audit.isError ? (
            <p className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">We couldn&apos;t load the ad figures. Please retry in a moment.</p>
          ) : !performance.data || !audit.data ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-card" />
              <Skeleton className="h-64 rounded-card" />
            </div>
          ) : (
            <>
              <MoneyStrip data={performance.data} />
              <Findings audit={audit.data} />
              <CampaignTable data={performance.data} />
              <AdTable data={performance.data} />
            </>
          )}
        </>
      )}

      <DisconnectMetaAdsDialog open={confirm} onOpenChange={setConfirm} onDone={refresh} />
    </div>
  );
}
