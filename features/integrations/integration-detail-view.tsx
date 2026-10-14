"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Ban, ChartColumn, Check, History, LoaderCircle, Plug, RefreshCw, Settings2, ShieldCheck } from "lucide-react";

import { FolderPanel, FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClaritySyncPanel } from "@/features/integrations/clarity-sync-panel";
import { GoogleConnectBanner } from "@/features/integrations/google-connect-banner";
import { GoogleSearchConsoleCard } from "@/features/integrations/google-search-console-card";
import { ActivityFeed } from "@/features/integrations/hub/activity-feed";
import { AppLogo } from "@/features/integrations/hub/app-logo";
import { useHub } from "@/features/integrations/hub/hub-context";
import { HubNoticeLine } from "@/features/integrations/hub/hub-notice-line";
import { HubStatusPill } from "@/features/integrations/hub/hub-status-pill";
import { KeySettingsPanel } from "@/features/integrations/hub/key-settings-panel";
import { GorgiasSettings } from "@/features/integrations/gorgias-settings";
import { KlaviyoSettings } from "@/features/integrations/klaviyo-settings";
import { NextStepButton } from "@/features/integrations/hub/next-step-button";
import { MetaAdsCard } from "@/features/integrations/meta-ads-card";
import { MetaCard } from "@/features/integrations/meta-card";
import { MetaConnectBanner, type MetaReturnState } from "@/features/integrations/meta-connect-banner";
import { QuickBooksCard } from "@/features/integrations/quickbooks-card";
import { useApiQuery } from "@/hooks/use-api-query";
import { useHydrated } from "@/hooks/use-hydrated";
import { APPS, AREAS, neverDo, type IntegrationApp, type IntegrationKey } from "@/lib/integration-catalog";
import {
  detailHref,
  needsOwner,
  parseDetailTab,
  relativeTime,
  runBars,
  type DetailTab,
} from "@/lib/integration-hub";
import { googleReturnState, syncPollInterval } from "@/lib/gsc-sync";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";
import type { HubConnection } from "@/types/integrations";

const TABS: { key: DetailTab; label: string; icon: typeof Plug }[] = [
  { key: "overview", label: "Overview", icon: ChartColumn },
  { key: "settings", label: "Settings", icon: Settings2 },
  { key: "history", label: "Sync history", icon: History },
  { key: "permissions", label: "Permissions", icon: ShieldCheck },
];

function metaReturn(value: string | null): MetaReturnState | null {
  return value === "connected" || value === "error" || value === "cancelled" ? value : null;
}

function Stat({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "bad" }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border bg-card p-4 shadow-xs">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-xl leading-tight font-semibold tabular-nums", tone === "bad" && "text-destructive")}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{note}</span>
    </div>
  );
}

function RunsChart({ appKey }: { appKey: string }) {
  // The chart reads the newest 60 events, as before the timeline paged (SPEC-328 patch).
  const query = useApiQuery(integrationQueries.activity(appKey, "all", 1, 60));
  if (query.isPending) return <Skeleton className="h-40" />;
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const bars = runBars(query.data.items);
  if (!bars.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No syncs yet. They appear here as they run.</p>;
  }
  const max = Math.max(1, ...bars.map((b) => b.records));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span>Rows per sync</span>
        <span className="tabular-nums">up to {max.toLocaleString("en-US")}</span>
      </div>
      <div className="flex h-36 items-end gap-1 border-b" role="img" aria-label={`Rows synced by the last ${bars.length} syncs`}>
        {bars.map((bar, i) => (
          <span
            key={`${bar.at}-${i}`}
            title={`${new Date(bar.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ${
              bar.result === "error" ? "failed" : `${bar.records.toLocaleString("en-US")} rows`
            }`}
            className={cn(
              "min-w-1 flex-1 rounded-t-sm",
              bar.result === "error" ? "bg-destructive" : bar.result === "running" ? "animate-pulse bg-foreground/30" : "bg-success/80",
            )}
            style={{ height: `${bar.result === "error" ? 100 : Math.max(4, (bar.records / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Oldest</span>
        <span>Latest</span>
      </div>
    </div>
  );
}

function Overview({ app, connection }: { app: IntegrationApp; connection: HubConnection }) {
  const { connect } = useHub();
  const now = new Date();
  if (!connection.connected) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 shadow-xs">
        <p className="text-base font-semibold">{app.name} is not connected</p>
        <p className="max-w-xl text-sm text-muted-foreground">
          Connect it to unlock {app.unlocks}. {app.description}
        </p>
        {connection.available ? (
          <Button onClick={() => connect(app.key)}>
            <Plug className="size-4" aria-hidden />
            Connect {app.name}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">The sign-in for {app.vendor ?? app.name} is not set up on this server yet.</p>
        )}
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Last successful sync"
          value={connection.canSync || connection.runs.length ? relativeTime(connection.lastSuccessAt, now) : "Not scheduled"}
          note={app.cadence}
        />
        <Stat label="Last run" value={relativeTime(connection.lastRunAt, now)} note={connection.status === "syncing" ? "Running now" : "Started"} />
        <Stat
          label="Rows in the last run"
          value={connection.lastRecords === null ? "—" : connection.lastRecords.toLocaleString("en-US")}
          note="Records read"
        />
        <Stat
          label="Problems · 7 days"
          value={String(connection.errors7d)}
          note={connection.errors7d ? "See Sync history" : "None"}
          tone={connection.errors7d ? "bad" : undefined}
        />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold">Last syncs</h3>
            <p className="text-xs text-muted-foreground">Each bar is one run. Red runs failed.</p>
          </div>
          {connection.runs.length || connection.canSync ? (
            <RunsChart appKey={app.key} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {app.name} has no sync schedule. It is used when you act, not on a timer.
            </p>
          )}
        </section>
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold">Powers these pages</h3>
            <p className="text-xs text-muted-foreground">Disconnecting {app.name} stops their {app.name} data.</p>
          </div>
          <ul className="flex flex-col gap-2">
            {app.powers.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex-1">{page.label}</span>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Permissions({ app }: { app: IntegrationApp }) {
  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold">What we read</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            {app.reads.map((line) => (
              <li key={line} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          {app.sends ? (
            <p className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
              The one thing we send: {app.sends}
            </p>
          ) : null}
        </section>
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold">What we never do</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            {neverDo(app).map((line) => (
              <li key={line} className="flex gap-2.5">
                <Ban className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs">
        <h3 className="text-sm font-semibold">Who can change this connection</h3>
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Connect, test, disconnect", "Members with “Manage integrations”"],
            ["See its status", "Members with “See integrations”"],
            ["Saved logins", "Encrypted, never sent to the browser"],
            ["Every change", "Written to the audit log"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-muted/40 px-3 py-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

function SettingsTab({ app, params }: { app: IntegrationApp; params: URLSearchParams }) {
  const router = useRouter();
  const settingsQ = useApiQuery(integrationQueries.settings());
  const googleQ = useApiQuery(integrationQueries.googleStatus(), {
    enabled: app.key === "gsc",
    refetchInterval: (query) => syncPollInterval(query.state.data?.sync),
  });
  const metaQ = useApiQuery(integrationQueries.metaStatus(), { enabled: app.key === "meta" });

  if (app.key === "shopify") {
    return <ShopifySettings />;
  }
  if (app.key === "quickbooks") return <QuickBooksCard />;
  if (app.key === "gsc") {
    const google = googleReturnState(params.get("google"));
    if (googleQ.isPending) return <Skeleton className="h-48 rounded-2xl" />;
    if (googleQ.isError) return <QueryErrorState error={googleQ.error} onRetry={() => void googleQ.refetch()} />;
    return (
      <>
        {google && google !== "choose" ? <GoogleConnectBanner state={google} reason={params.get("reason")} /> : null}
        <GoogleSearchConsoleCard status={googleQ.data} openPicker={google === "choose"} />
      </>
    );
  }
  if (app.key === "meta") {
    const meta = metaReturn(params.get("meta"));
    if (metaQ.isPending) return <Skeleton className="h-48 rounded-2xl" />;
    if (metaQ.isError) return <QueryErrorState error={metaQ.error} onRetry={() => void metaQ.refetch()} />;
    // One Meta card, two jobs (owner, 2026-10-01): posting and the read-only Ads audit,
    // each with its own Meta permission and sign-in.
    return (
      <>
        <MetaPart title="Posting" note="Publishes the posts you approve in Social Media Manager.">
          {meta ? <MetaConnectBanner state={meta} reason={params.get("reason")} /> : null}
          <MetaCard status={metaQ.data} />
        </MetaPart>
        <MetaPart title="Ads audit" note="Reads the ad accounts you choose, read-only, for Paid Ads Manager.">
          <MetaAdsCard />
        </MetaPart>
      </>
    );
  }
  if (!app.provider) return null;
  if (settingsQ.isPending) return <Skeleton className="h-64 rounded-2xl" />;
  if (settingsQ.isError) return <QueryErrorState error={settingsQ.error} onRetry={() => void settingsQ.refetch()} />;
  const settings = settingsQ.data[app.provider];
  const connected = Object.values(settings.secrets).every((s) => s.configured);
  const startDisconnect = params.get("disconnect") === "1";
  const panel = (
    <KeySettingsPanel
      key={app.key}
      provider={app.provider}
      testKey={app.key}
      name={app.name}
      fields={app.fields ?? []}
      secrets={app.secrets ?? []}
      settings={settings}
      canDisconnect={connected}
      startDisconnect={startDisconnect}
      onDisconnected={() => router.push("/integrations")}
    >
      {app.key === "clarity" && connected ? <ClaritySyncPanel /> : null}
    </KeySettingsPanel>
  );
  // SPEC-371: Klaviyo offers Connect with Klaviyo first, the key form under it.
  if (app.key === "klaviyo") {
    return <KlaviyoSettings keySaved={connected} startOpen={startDisconnect} params={params} keyPanel={panel} />;
  }
  // SPEC-372: Gorgias offers Connect with Gorgias first, the key form under it.
  if (app.key === "gorgias") {
    return (
      <GorgiasSettings
        keySaved={connected}
        startOpen={startDisconnect}
        savedSubdomain={settings.fields.subdomain?.value ?? null}
        params={params}
        keyPanel={panel}
      />
    );
  }
  return panel;
}

function MetaPart({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

function ShopifySettings() {
  const overview = useApiQuery(integrationQueries.overview());
  const account = overview.data?.integrations.find((i) => i.key === "shopify")?.account;
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs">
      <h3 className="text-sm font-semibold">Store</h3>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/40 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Store address</dt>
          <dd className="truncate font-mono text-sm">{account?.shopDomain ?? "—"}</dd>
        </div>
        <div className="rounded-lg border bg-muted/40 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Sync</dt>
          <dd className="text-sm font-semibold">Every 15 minutes, automatically</dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">
        Your store connects through the Shopify app, so there is nothing to type here. To reconnect it, go to{" "}
        <Link href="/settings" className="font-medium text-foreground underline">
          Settings
        </Link>
        . To remove access, uninstall the app from your Shopify admin.
      </p>
    </section>
  );
}

function PrimaryAction({ app, connection }: { app: IntegrationApp; connection: HubConnection }) {
  const { connect, syncNow, starting } = useHub();
  if (!connection.connected) {
    return connection.available ? (
      <Button onClick={() => connect(app.key)}>
        <Plug className="size-4" aria-hidden />
        Connect
      </Button>
    ) : null;
  }
  if (needsOwner(connection) && connection.attention) {
    return <NextStepButton connection={connection} appKey={app.key} size="default" />;
  }
  if (!connection.canSync) return null;
  const busy = starting.has(app.key) || connection.status === "syncing";
  return (
    <Button variant="outline" disabled={busy} onClick={() => void syncNow(app.key, app.name)}>
      {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
      {busy ? "Syncing…" : "Sync now"}
    </Button>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

/** One app's own page (SPEC-328): what it is doing, how to set it up, its history and what it
 * may touch. The tabs are held in the URL; a sign-in return lands on Settings. */
export function IntegrationDetailView({ appKey }: { appKey: IntegrationKey }) {
  const app = APPS[appKey];
  const hydrated = useHydrated();
  const params = new URLSearchParams(useSearchParams().toString());
  const tab = parseDetailTab(params);
  const overviewQ = useApiQuery(integrationQueries.overview(), {
    refetchInterval: (q) => (q.state.data?.integrations.find((i) => i.key === appKey)?.status === "syncing" ? 5_000 : false),
  });

  let body: React.ReactNode;
  if (!hydrated || overviewQ.isPending) body = <DetailSkeleton />;
  else if (overviewQ.isError) body = <QueryErrorState error={overviewQ.error} onRetry={() => void overviewQ.refetch()} />;
  else {
    const connection = overviewQ.data.integrations.find((i) => i.key === appKey);
    if (!connection) {
      body = (
        <QueryErrorState
          error={new Error(`${app.name} is not available on this server.`)}
          onRetry={() => void overviewQ.refetch()}
        />
      );
    } else {
      const since =
        connection.connectedAt !== null
          ? new Date(connection.connectedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          : null;
      body = (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <AppLogo src={app.logo} size="lg" />
            <div className="min-w-0 flex-1 basis-72">
              <h1 className="flex flex-wrap items-center gap-3 font-heading text-2xl tracking-wide">
                {app.name}
                <HubStatusPill status={connection.status} />
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {AREAS[app.area]} · {app.description}
                {connection.connected && since
                  ? ` Connected${connection.connectedBy ? ` by ${connection.connectedBy}` : ""} on ${since}.`
                  : ""}
              </p>
            </div>
            <PrimaryAction app={app} connection={connection} />
          </div>
          {needsOwner(connection) && connection.attention ? (
            <p
              className={cn(
                "rounded-xl border border-l-4 bg-card px-4 py-3 text-sm",
                connection.status === "attention" ? "border-l-destructive" : "border-l-warning",
              )}
            >
              <span className="font-semibold">{connection.status === "attention" ? "Action needed. " : "Coming up. "}</span>
              {connection.attention.message}
            </p>
          ) : null}
          <HubNoticeLine />
          <div>
            <FolderTabBar label={`${app.name} sections`}>
              {TABS.map((item) => {
                const active = item.key === tab;
                return (
                  <ShallowLink
                    key={item.key}
                    href={detailHref(app.key, item.key)}
                    aria-current={active ? "page" : undefined}
                    {...folderTab(active)}
                  >
                    <item.icon className="size-3.5" aria-hidden />
                    {item.label}
                  </ShallowLink>
                );
              })}
            </FolderTabBar>
            <FolderPanel>
              {tab === "overview" ? <Overview app={app} connection={connection} /> : null}
              {tab === "settings" ? <SettingsTab app={app} params={params} /> : null}
              {tab === "history" ? <ActivityFeed appKey={app.key} connections={overviewQ.data.integrations} /> : null}
              {tab === "permissions" ? <Permissions app={app} /> : null}
            </FolderPanel>
          </div>
        </>
      );
    }
  }

  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <Link
        href="/integrations"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All integrations
      </Link>
      {body}
    </main>
  );
}
