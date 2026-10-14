"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AccountPicker,
  ConnectMetaCard,
  DisconnectMetaAdsDialog,
  MetaAdsReturnNotice,
} from "@/features/ads/audit/audit-connect";
import { useHub } from "@/features/integrations/hub/hub-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { ADS_CONNECT_FLAG, connectionStage } from "@/lib/ad-platforms";
import { adsQueries } from "@/lib/queries/ads";
import { agoLabel } from "@/lib/trust-footer";
import { cn } from "@/lib/utils";
import { metaAdsAuthorizeUrl } from "@/services/ad-platforms-actions";

/**
 * The Ads audit half of Meta's one card in Integrations (SPEC-333 patch / backend SPEC-342 patch): connect,
 * choose the ad accounts, sync now, disconnect. It reads the same `adsQueries.platforms()`
 * cache and calls the same `/ads/platforms/*` endpoints as Performance Ads' Audit tab, so the
 * two screens can never disagree about the connection.
 */
export function MetaAdsCard() {
  const params = useSearchParams();
  const { syncNow, starting, refresh } = useHub();
  const status = useApiQuery(adsQueries.platforms());
  const [changing, setChanging] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (status.isPending) return <Skeleton className="h-48 rounded-2xl" />;
  if (status.isError) return <QueryErrorState error={status.error} onRetry={() => void status.refetch()} />;

  const stage = connectionStage(status.data);
  const meta = status.data.platforms.find((p) => p.platform === "meta");
  // On Meta's page `meta=` is the posting sign-in's result; the Ads one comes back as `ads=`.
  const notice = <MetaAdsReturnNotice value={params.get("ads")} reason={params.get("reason")} />;

  if (stage === "unconfigured" || stage === "disconnected" || !meta) {
    return (
      <>
        {notice}
        <ConnectMetaCard configured={status.data.configured} from="integrations" />
      </>
    );
  }

  const chosen = meta.accounts.filter((a) => a.selected);
  if (stage === "choose" || changing) {
    return (
      <>
        {notice}
        <AccountPicker
          key={meta.accounts.map((a) => `${a.id}:${a.selected}`).join(",")}
          accounts={meta.accounts}
          onSaved={async () => {
            setChanging(false);
            refresh();
            void syncNow("meta", "Meta Ads");
          }}
        />
        {changing && (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setChanging(false)}>
            Keep the current accounts
          </Button>
        )}
      </>
    );
  }

  const busy = starting.has("meta");
  return (
    <>
      {notice}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("size-2 rounded-full", meta.status === "connected" ? "bg-success" : "bg-destructive")} aria-hidden />
          <h3 className="text-sm font-semibold">
            {meta.status === "connected" ? "Connected, read-only" : "Meta needs you to sign in again"}
          </h3>
          {meta.connectedBy && <span className="text-xs text-muted-foreground">by {meta.connectedBy}</span>}
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Ad accounts read</dt>
            <dd className="text-sm font-semibold">
              {chosen.map((a) => a.name).join(", ")}
              <span className="font-normal text-muted-foreground"> · {chosen.length} of {meta.accounts.length}</span>
            </dd>
          </div>
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Last read</dt>
            <dd className="text-sm font-semibold">
              {meta.lastSyncedAt ? agoLabel(meta.lastSyncedAt) : "First read running"}
              <span className="font-normal text-muted-foreground"> · every 3 hours</span>
            </dd>
          </div>
        </dl>
        {meta.lastError && (
          <p role="alert" className="rounded-xl border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
            {meta.lastError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {meta.status === "connected" ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void syncNow("meta", "Meta Ads")}>
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              Sync now
            </Button>
          ) : (
            <ConnectAgain />
          )}
          <Button size="sm" variant="outline" onClick={() => setChanging(true)}>
            Change ad accounts
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/ads?tab=audit">
              Open the audit
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => setConfirm(true)}>
            Disconnect
          </Button>
        </div>
      </section>
      <DisconnectMetaAdsDialog open={confirm} onOpenChange={setConfirm} onDone={refresh} />
    </>
  );
}

/** A refused login is fixed by signing in again — the same consent, the same accounts kept. */
function ConnectAgain() {
  const [going, setGoing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button
        size="sm"
        disabled={going}
        onClick={async () => {
          setGoing(true);
          setError(null);
          try {
            try {
              window.sessionStorage.setItem(ADS_CONNECT_FLAG, "integrations");
            } catch {
              // Storage blocked: the backend still recognises the Ads sign-in by its state.
            }
            window.location.assign(await metaAdsAuthorizeUrl());
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not reach Meta.");
            setGoing(false);
          }
        }}
      >
        {going && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        Sign in to Meta again
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
