"use client";

import Link from "next/link";
import { Clock, LayoutGrid, Layers, List } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { AppLogo } from "@/features/integrations/hub/app-logo";
import { ConnectionMenu } from "@/features/integrations/hub/connection-menu";
import { HubStatusPill, TONE_DOT } from "@/features/integrations/hub/hub-status-pill";
import { PowersChips } from "@/features/integrations/hub/powers-chips";
import { RunBars } from "@/features/integrations/hub/run-bars";
import { AREA_ORDER, AREAS, type IntegrationApp } from "@/lib/integration-catalog";
import {
  appFor,
  detailHref,
  filterCounts,
  hubHref,
  matchesFilter,
  matchesQuery,
  needsOwner,
  relativeTime,
  sortConnections,
  type HubFilter,
  type HubLayout,
} from "@/lib/integration-hub";
import { cn } from "@/lib/utils";
import type { HubConnection } from "@/types/integrations";

interface Row {
  app: IntegrationApp;
  connection: HubConnection;
}

const FILTERS: { key: HubFilter; label: string; dot: string | null }[] = [
  { key: "all", label: "All", dot: null },
  { key: "healthy", label: "Healthy", dot: TONE_DOT.success },
  { key: "syncing", label: "Syncing", dot: TONE_DOT.neutral },
  { key: "attention", label: "Need you", dot: TONE_DOT.destructive },
];

const LAYOUTS: { key: HubLayout; label: string; icon: typeof List }[] = [
  { key: "list", label: "List", icon: List },
  { key: "cards", label: "Cards", icon: LayoutGrid },
  { key: "areas", label: "By area", icon: Layers },
];

function lastSync(connection: HubConnection, now: Date): string {
  if (connection.status === "syncing") return "Syncing now";
  if (!connection.canSync && !connection.runs.length) return "No schedule";
  return relativeTime(connection.lastSuccessAt, now);
}

/** A connection's line: the name is the link and covers the row; the menu sits above it. */
function ConnectionRow({ row, now }: { row: Row; now: Date }) {
  const { app, connection } = row;
  return (
    <div
      role="listitem"
      className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted/40 md:grid-cols-[minmax(12rem,1.5fr)_9.5rem_9rem_minmax(9rem,1.4fr)_2.5rem] xl:grid-cols-[minmax(12rem,1.5fr)_9.5rem_9rem_8.5rem_minmax(9rem,1.4fr)_2.5rem]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <AppLogo src={app.logo} />
        <div className="min-w-0">
          <Link
            href={detailHref(app.key)}
            className="flex items-center gap-2 truncate font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
          >
            {app.name}
            {app.key === "shopify" ? (
              <span className="rounded border px-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Your store
              </span>
            ) : null}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {needsOwner(connection) && connection.attention ? connection.attention.message : app.sub}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex justify-end md:hidden">
        <ConnectionMenu app={app} connection={connection} />
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 md:contents">
        <div>
          <HubStatusPill status={connection.status} />
        </div>
        <div className="text-sm">
          <p className="font-medium tabular-nums">{lastSync(connection, now)}</p>
          <p className="hidden text-xs text-muted-foreground md:block">{app.cadence}</p>
        </div>
        <div className="hidden xl:block">
          <RunBars runs={connection.runs} />
        </div>
        <div className="hidden min-w-0 md:block">
          <PowersChips powers={app.powers} />
        </div>
      </div>
      <div className="relative z-10 hidden justify-end md:flex">
        <ConnectionMenu app={app} connection={connection} />
      </div>
    </div>
  );
}

function ConnectionTable({ rows, now }: { rows: Row[]; now: Date }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div
        aria-hidden
        className="hidden h-10 items-center gap-x-4 border-b px-4 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase md:grid md:grid-cols-[minmax(12rem,1.5fr)_9.5rem_9rem_minmax(9rem,1.4fr)_2.5rem] xl:grid-cols-[minmax(12rem,1.5fr)_9.5rem_9rem_8.5rem_minmax(9rem,1.4fr)_2.5rem]"
      >
        <span>App</span>
        <span>Status</span>
        <span>Last sync</span>
        <span className="hidden xl:block">Last syncs</span>
        <span>Powers</span>
        <span />
      </div>
      <div role="list">
        {rows.map((row) => (
          <ConnectionRow key={row.app.key} row={row} now={now} />
        ))}
      </div>
    </div>
  );
}

function ConnectionCard({ row, now }: { row: Row; now: Date }) {
  const { app, connection } = row;
  return (
    <div className="relative flex flex-col gap-3.5 rounded-2xl border bg-card p-4 shadow-xs transition-colors hover:border-foreground/30">
      <div className="flex items-center gap-3">
        <AppLogo src={app.logo} />
        <div className="min-w-0 flex-1">
          <Link
            href={detailHref(app.key)}
            className="block truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {app.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{app.sub}</p>
        </div>
        <div className="relative z-10">
          <ConnectionMenu app={app} connection={connection} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <HubStatusPill status={connection.status} />
        <RunBars runs={connection.runs} />
      </div>
      <p className="text-sm text-muted-foreground">
        {needsOwner(connection) && connection.attention ? connection.attention.message : app.description}
      </p>
      <PowersChips powers={app.powers} max={4} />
      <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 tabular-nums">
          <Clock className="size-3.5" aria-hidden />
          {lastSync(connection, now)}
        </span>
        <span>{app.cadence}</span>
      </div>
    </div>
  );
}

/** The Connected tab (SPEC-328): status chips, three layouts, one line per connection. */
export function ConnectedTab({
  connections,
  filter,
  layout,
  query,
  onClearQuery,
}: {
  connections: HubConnection[];
  filter: HubFilter;
  layout: HubLayout;
  query: string;
  onClearQuery: () => void;
}) {
  const now = new Date();
  const connected = connections.filter((c) => c.connected);
  const counts = filterCounts(connected);
  const rows: Row[] = sortConnections(connected)
    .filter((c) => matchesFilter(c, filter))
    .flatMap((connection) => {
      const app = appFor(connection.key);
      return app && matchesQuery(app, query) ? [{ app, connection }] : [];
    });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => {
            const on = item.key === filter;
            return (
              <ShallowLink
                key={item.key}
                href={hubHref({ tab: "connected", filter: item.key, view: layout })}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {item.dot ? <span className={cn("size-2 rounded-full", item.dot)} aria-hidden /> : null}
                {item.label}
                <span className="tabular-nums">{counts[item.key]}</span>
              </ShallowLink>
            );
          })}
        </div>
        <div role="group" aria-label="Layout" className="ml-auto inline-flex gap-0.5 rounded-[10px] bg-muted p-0.5">
          {LAYOUTS.map((item) => {
            const on = item.key === layout;
            return (
              <ShallowLink
                key={item.key}
                href={hubHref({ tab: "connected", filter, view: item.key })}
                replace
                aria-current={on ? "true" : undefined}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">{item.label}</span>
              </ShallowLink>
            );
          })}
        </div>
      </div>

      {!rows.length ? (
        <div className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          <p className="text-base font-semibold text-foreground">Nothing matches</p>
          <p className="mt-1">
            {query ? `No connected app matches “${query}”.` : "No connected app is in this state right now."}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            {query ? (
              <button type="button" className="font-medium text-foreground underline" onClick={onClearQuery}>
                Clear the search
              </button>
            ) : null}
            {filter !== "all" ? (
              <ShallowLink href={hubHref({ tab: "connected", view: layout })} className="font-medium text-foreground underline">
                Show all
              </ShallowLink>
            ) : null}
          </div>
        </div>
      ) : layout === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <ConnectionCard key={row.app.key} row={row} now={now} />
          ))}
        </div>
      ) : layout === "areas" ? (
        AREA_ORDER.map((area) => {
          const group = rows.filter((row) => row.app.area === area);
          if (!group.length) return null;
          return (
            <section key={area} aria-label={AREAS[area]} className="space-y-2.5">
              <h3 className="flex items-baseline gap-2 text-sm font-semibold">
                {AREAS[area]}
                <span className="text-xs font-normal text-muted-foreground">{group.length} connected</span>
              </h3>
              <ConnectionTable rows={group} now={now} />
            </section>
          );
        })
      ) : (
        <ConnectionTable rows={rows} now={now} />
      )}
    </>
  );
}
