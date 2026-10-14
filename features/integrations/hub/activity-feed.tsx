"use client";

import { useState } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { TablePager } from "@/components/shared/table-pager";
import { AppLogo } from "@/features/integrations/hub/app-logo";
import { NextStepButton } from "@/features/integrations/hub/next-step-button";
import { TONE_PILL } from "@/features/integrations/hub/hub-status-pill";
import { useApiQuery } from "@/hooks/use-api-query";
import { APPS, INTEGRATION_KEYS, isIntegrationKey } from "@/lib/integration-catalog";
import { ACTIVITY_PAGE_SIZE, activityPages, clockTime, formatDuration, groupByDay, type Tone } from "@/lib/integration-hub";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityKind, HubConnection } from "@/types/integrations";

const RESULT: Record<ActivityItem["result"], { label: string; tone: Tone }> = {
  success: { label: "Done", tone: "success" },
  error: { label: "Failed", tone: "destructive" },
  running: { label: "Running", tone: "neutral" },
  change: { label: "Change", tone: "muted" },
};

const KINDS: { key: ActivityKind; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "problems", label: "Problems" },
  { key: "changes", label: "Changes" },
];

function nameOf(key: string): string {
  if (key === "smtp") return "Email delivery";
  return isIntegrationKey(key) ? APPS[key].name : key;
}

function EventRow({
  item,
  scoped,
  open,
  onToggle,
  connection,
}: {
  item: ActivityItem;
  scoped: boolean;
  open: boolean;
  onToggle: () => void;
  connection: HubConnection | undefined;
}) {
  const app = isIntegrationKey(item.key) ? APPS[item.key] : null;
  const result = RESULT[item.result];
  const expandable = item.result === "error" && item.detail !== null;
  const body = (
    <>
      <span className="text-xs text-muted-foreground tabular-nums">{clockTime(item.at)}</span>
      {app ? <AppLogo src={app.logo} size="sm" /> : <span className="size-7" />}
      <span className="min-w-0 text-sm">
        {scoped ? null : <span className="mr-1.5 font-semibold">{nameOf(item.key)}</span>}
        <span>{item.message}</span>
        {item.actor ? <span className="block text-xs text-muted-foreground">by {item.actor}</span> : null}
      </span>
      <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-semibold", TONE_PILL[result.tone])}>
        {result.label}
        {expandable ? <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} aria-hidden /> : null}
      </span>
      <span className="hidden text-right text-xs text-muted-foreground tabular-nums sm:block">
        {item.records !== null ? `${item.records.toLocaleString("en-US")} rows` : "—"}
      </span>
      <span className="hidden text-right text-xs text-muted-foreground tabular-nums sm:block">
        {formatDuration(item.durationSeconds)}
      </span>
    </>
  );
  const grid =
    "grid w-full grid-cols-[3rem_1.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left sm:grid-cols-[3rem_1.75rem_minmax(0,1fr)_auto_5.5rem_4.5rem]";
  return (
    <li className="border-b last:border-b-0">
      {expandable ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className={cn(grid, "outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset")}
        >
          {body}
        </button>
      ) : (
        <div className={grid}>{body}</div>
      )}
      {expandable && open ? (
        <div className="mx-4 mb-3 flex flex-wrap items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 sm:ml-[6.75rem]">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <p className="min-w-0 flex-1 basis-64 font-mono text-xs break-words text-muted-foreground">{item.detail}</p>
          {connection && connection.attention && app ? <NextStepButton connection={connection} appKey={app.key} /> : null}
        </div>
      ) : null}
    </li>
  );
}

/** The timeline (SPEC-328): syncs and changes, newest first, grouped by day. With `appKey`
 * it is one app's Sync history; without, every app's, with an app picker. */
export function ActivityFeed({
  appKey = null,
  connections,
}: {
  appKey?: string | null;
  connections: HubConnection[];
}) {
  const [kind, setKind] = useState<ActivityKind>("all");
  const [picked, setPicked] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const key = appKey ?? (picked === "all" ? null : picked);
  const query = useApiQuery(integrationQueries.activity(key, kind, page));
  const pages = query.data ? activityPages(query.data.total) : 1;
  // A new filter starts at page 1; nothing stays expanded across pages.
  const choose = (next: { kind?: ActivityKind; picked?: string; page?: number }) => {
    if (next.kind !== undefined) setKind(next.kind);
    if (next.picked !== undefined) setPicked(next.picked);
    setPage(next.page ?? 1);
    setOpen(new Set());
  };
  const byKey = new Map(connections.map((c) => [c.key, c]));
  const connectedKeys = INTEGRATION_KEYS.filter((k) => byKey.get(k)?.connected);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Show" className="inline-flex gap-0.5 rounded-[10px] bg-muted p-0.5">
          {KINDS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={kind === item.key}
              onClick={() => choose({ kind: item.key })}
              className={cn(
                "h-7 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                kind === item.key ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {appKey ? null : (
          <Select value={picked} onValueChange={(value) => choose({ picked: value })}>
            <SelectTrigger className="ml-auto w-56 bg-card" aria-label="App">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All apps</SelectItem>
              {connectedKeys.map((k) => (
                <SelectItem key={k} value={k}>
                  {APPS[k].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {query.isPending ? (
        <div className="space-y-2 rounded-2xl border bg-card p-4" aria-label="Loading the timeline">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : query.isError ? (
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !query.data.items.length ? (
        <div className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          <p className="text-base font-semibold text-foreground">Nothing to show</p>
          <p className="mt-1">
            {kind === "problems"
              ? "No failed syncs. Everything that ran, finished."
              : kind === "changes"
                ? "Nobody has changed a connection yet."
                : "Syncs appear here as they run."}
          </p>
        </div>
      ) : (
        <div data-slot="card" className="overflow-hidden rounded-2xl border bg-card shadow-xs">
          {groupByDay(query.data.items, new Date()).map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h4 className="border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </h4>
              <ul>
                {group.items.map((item, index) => {
                  const id = `${item.at}-${item.key}-${index}`;
                  return (
                    <EventRow
                      key={id}
                      item={item}
                      scoped={appKey !== null}
                      open={open.has(id)}
                      connection={byKey.get(item.key)}
                      onToggle={() =>
                        setOpen((prev) => {
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        })
                      }
                    />
                  );
                })}
              </ul>
            </section>
          ))}
          <TablePager
            page={Math.min(page, pages)}
            pages={pages}
            pageSize={ACTIVITY_PAGE_SIZE}
            matches={query.data.total}
            noun={query.data.total === 1 ? "event" : "events"}
            onPage={(next) => choose({ page: next })}
          />
        </div>
      )}
    </div>
  );
}
