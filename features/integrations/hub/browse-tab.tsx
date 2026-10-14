"use client";

import Link from "next/link";
import { ArrowRight, Check, Plug } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/features/integrations/hub/app-logo";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { browseKeys, isGuided } from "@/lib/company-switches";
import { useHub } from "@/features/integrations/hub/hub-context";
import { HubStatusPill } from "@/features/integrations/hub/hub-status-pill";
import {
  APPS,
  AREAS,
  COMING_SOON,
  INTEGRATION_KEYS,
  connectMethod,
  type ComingSoonApp,
  type IntegrationApp,
} from "@/lib/integration-catalog";
import { detailHref, hubHref, matchesQuery, type BrowseCategory } from "@/lib/integration-hub";
import { cn } from "@/lib/utils";
import type { HubConnection } from "@/types/integrations";

const CATEGORIES: { key: BrowseCategory; label: string }[] = [
  { key: "all", label: "All apps" },
  ...(Object.entries(AREAS) as [BrowseCategory, string][]).map(([key, label]) => ({ key, label })),
  { key: "soon", label: "Coming soon" },
];

function AppTile({ app, connection }: { app: IntegrationApp; connection: HubConnection | undefined }) {
  const { connect } = useHub();
  const connected = connection?.connected ?? false;
  const unavailable = connection ? !connection.available && !connected : false;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <AppLogo src={app.logo} />
        {connection && connected ? <HubStatusPill status={connection.status} /> : null}
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{AREAS[app.area]}</p>
        <h4 className="text-[15px] font-semibold">{app.name}</h4>
      </div>
      <p className="flex-1 text-sm text-muted-foreground">{app.description}</p>
      {!connected ? (
        <p className="flex gap-2 rounded-lg border bg-muted/40 px-2.5 py-2 text-xs">
          <Check className="mt-px size-3.5 shrink-0 text-success" aria-hidden />
          <span>
            <span className="font-semibold">Unlocks</span> {app.unlocks}
          </span>
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        {connected ? (
          <Button asChild variant="outline" size="sm">
            <Link href={detailHref(app.key)}>
              Manage
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        ) : unavailable ? (
          <span className="text-xs text-muted-foreground">Not set up on this server yet</span>
        ) : (
          <Button size="sm" onClick={() => connect(app.key)}>
            <Plug className="size-3.5" aria-hidden />
            Connect
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{connectMethod(app)}</span>
      </div>
    </div>
  );
}

function SoonTile({ app }: { app: ComingSoonApp }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed p-4">
      <div className="flex items-start justify-between gap-2">
        <AppLogo src={app.logo} className="opacity-70" />
        <span className="rounded-full border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Coming soon
        </span>
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{AREAS[app.area]}</p>
        <h4 className="text-[15px] font-semibold">{app.name}</h4>
      </div>
      <p className="text-sm text-muted-foreground">{app.description}</p>
    </div>
  );
}

/** Browse apps (SPEC-328): every app by area, what each unlocks, and Connect. A guided
 * organization sees the apps its workspace uses — Shopify, what is connected, and what a page,
 * tab or employee it switched on needs (SPEC-360) — and how to add more. */
export function BrowseTab({
  connections,
  category,
  query,
  onClearQuery,
}: {
  connections: HubConnection[];
  category: BrowseCategory;
  query: string;
  onClearQuery: () => void;
}) {
  const { visibility } = useWorkspace();
  const guided = isGuided(visibility);
  const byKey = new Map(connections.map((c) => [c.key, c]));
  const apps = browseKeys(visibility, INTEGRATION_KEYS).map((key) => APPS[key]);
  const count = (key: BrowseCategory) =>
    key === "all"
      ? apps.length + COMING_SOON.length
      : key === "soon"
        ? COMING_SOON.length
        : apps.filter((a) => a.area === key).length + COMING_SOON.filter((a) => a.area === key).length;
  const live = category === "soon" ? [] : apps.filter((a) => (category === "all" || a.area === category) && matchesQuery(a, query));
  const soon = COMING_SOON.filter(
    (a) => (category === "all" || category === "soon" || a.area === category) && matchesQuery(a, query),
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Categories" className="flex gap-1.5 overflow-x-auto scrollbar-none lg:sticky lg:top-20 lg:flex-col lg:gap-0.5">
        {CATEGORIES.map((item) => {
          const on = item.key === category;
          return (
            <ShallowLink
              key={item.key}
              href={hubHref({ tab: "browse", category: item.key })}
              replace
              aria-current={on ? "true" : undefined}
              className={cn(
                "flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring lg:border-transparent",
                on
                  ? "border-border bg-card text-foreground shadow-xs lg:border-border"
                  : "bg-card text-muted-foreground hover:text-foreground lg:bg-transparent lg:hover:bg-muted",
              )}
            >
              {item.label}
              <span className="text-xs tabular-nums text-muted-foreground">{count(item.key)}</span>
            </ShallowLink>
          );
        })}
      </nav>
      <div className="flex min-w-0 flex-col gap-4">
        {guided ? (
          <p className="rounded-xl border border-dashed bg-card px-3 py-2.5 text-sm text-muted-foreground">
            These are the apps your workspace uses. To add another, turn on the page or employee that needs it in{" "}
            <Link href="/settings/sidebar" className="font-medium text-foreground underline underline-offset-2">
              Settings → Sidebar
            </Link>
            .
          </p>
        ) : null}
        {!live.length && !soon.length ? (
          <div className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            <p className="text-base font-semibold text-foreground">No app called “{query}”</p>
            <p className="mt-1">Try another name, or browse a category.</p>
            <button type="button" className="mt-3 font-medium text-foreground underline" onClick={onClearQuery}>
              Clear the search
            </button>
          </div>
        ) : null}
        {live.length ? (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {live.map((app) => (
              <AppTile key={app.key} app={app} connection={byKey.get(app.key)} />
            ))}
          </div>
        ) : null}
        {soon.length ? (
          <>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">Coming soon</h3>
              <span className="text-xs text-muted-foreground">Not connectable yet</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {soon.map((app) => (
                <SoonTile key={app.name} app={app} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
