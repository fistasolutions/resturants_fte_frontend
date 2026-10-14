"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientApi } from "@/lib/client-api";
import { CONFIDENCE_META, TOPIC_ORDER, topicLabel } from "@/lib/customer-support";
import { CHANNEL_LABELS } from "@/lib/helpdesk-providers";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import {
  APPROVAL_SORTS,
  CONFIDENCE_FILTERS,
  approvalsHref,
  hasFilters,
  pageCount,
  rangeLabel,
  type ApprovalSort,
  type ApprovalsView,
} from "@/lib/support-approvals";
import { cn } from "@/lib/utils";
import type { ApprovalsPage, Channel, TopicKey } from "@/types/customer-support";

/** Move the URL in place — no server render; the page query follows the URL (SPEC-349). */
export function goTo(href: string, replace = false): void {
  if (replace) window.history.replaceState(null, "", href);
  else window.history.pushState(null, "", href);
}

const ALL = "all";

function Count({ value, active = false }: { value: number | undefined; active?: boolean }) {
  return (
    <span
      className={cn(
        "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums",
        active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
      )}
    >
      {value ?? 0}
    </span>
  );
}

/**
 * The Approvals filter bar (SPEC-349): confidence as tags, topic and channel with their counts,
 * a debounced search and the sort. Every change moves the URL in place and goes back to page 1;
 * the counts are over every waiting reply, so they never change with the filters.
 */
export function ApprovalsFilters({ view, counts }: { view: ApprovalsView; counts: ApprovalsPage["counts"] }) {
  const [typed, setTyped] = useState(view.q);
  // Back/forward or "Clear filters" moved the URL's search: the box follows it.
  const [seenQ, setSeenQ] = useState(view.q);
  if (seenQ !== view.q) {
    setSeenQ(view.q);
    setTyped(view.q);
  }

  // Search as you type, settled for 300 ms; replace, so typing is not a trail of history entries.
  useEffect(() => {
    if (typed.trim() === view.q.trim()) return;
    const handle = window.setTimeout(() => goTo(approvalsHref(view, { q: typed }), true), 300);
    return () => window.clearTimeout(handle);
  }, [typed, view]);

  const topics = TOPIC_ORDER.filter((t: TopicKey) => (counts.topics[t] ?? 0) > 0 || t === view.topic);
  const channels = (Object.keys(CHANNEL_LABELS) as Channel[]).filter((c) => (counts.channels[c] ?? 0) > 0 || c === view.channel);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2.5 lg:flex-row lg:flex-wrap lg:items-center">
      <nav aria-label="Confidence" className="flex flex-wrap gap-1.5">
        <ShallowLink
          href={approvalsHref(view, { confidence: null })}
          aria-current={view.confidence === null ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-none whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            view.confidence === null ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
          )}
        >
          All <Count value={counts.all} active={view.confidence === null} />
        </ShallowLink>
        {CONFIDENCE_FILTERS.map((band) => {
          const active = view.confidence === band;
          return (
            <ShallowLink
              key={band}
              href={approvalsHref(view, { confidence: active ? null : band })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-none whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {CONFIDENCE_META[band].label.replace(" confidence", "")}
              <Count value={counts.confidence[band]} active={active} />
            </ShallowLink>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-end">
        <Select value={view.topic ?? ALL} onValueChange={(value) => goTo(approvalsHref(view, { topic: value === ALL ? null : (value as TopicKey) }))}>
          <SelectTrigger className="h-8 w-44 text-xs" aria-label="Filter by topic">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All topics</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>
                {topicLabel(t)} ({counts.topics[t] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={view.channel ?? ALL} onValueChange={(value) => goTo(approvalsHref(view, { channel: value === ALL ? null : (value as Channel) }))}>
          <SelectTrigger className="h-8 w-36 text-xs" aria-label="Filter by channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All channels</SelectItem>
            {channels.map((c) => (
              <SelectItem key={c} value={c}>
                {CHANNEL_LABELS[c]} ({counts.channels[c] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-40 flex-1 sm:max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value.slice(0, 80))}
            placeholder="Customer, email or subject"
            aria-label="Search the replies waiting"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={view.sort} onValueChange={(value) => goTo(approvalsHref(view, { sort: value as ApprovalSort }))}>
          <SelectTrigger className="h-8 w-48 text-xs" aria-label="Sort the replies">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPROVAL_SORTS.map((sort) => (
              <SelectItem key={sort.key} value={sort.key}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters(view) ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTyped("");
              goTo(approvalsHref({ ...view, topic: null, channel: null, confidence: null, q: "" }, { page: 1 }));
            }}
          >
            <X aria-hidden /> Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Previous · "Page 2 of 5" · Next, with the range; a neighbour page is warmed on hover. */
export function ApprovalsPager({ view, page }: { view: ApprovalsView; page: ApprovalsPage }) {
  const queryClient = useQueryClient();
  const pages = pageCount(page.total, page.pageSize);
  const warm = (to: number) => {
    const def = customerSupportQueries.approvalsPage({ ...view, page: to });
    void queryClient.prefetchQuery({ queryKey: def.queryKey, queryFn: () => def.load(clientApi) });
  };
  const link = "inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const off = "inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground opacity-50";
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <p className="text-xs text-muted-foreground tabular-nums">{rangeLabel(page.page, page.pageSize, page.total)}</p>
      <div className="flex items-center gap-2">
        {page.page > 1 ? (
          <ShallowLink href={approvalsHref(view, { page: page.page - 1 })} onMouseEnter={() => warm(page.page - 1)} onFocus={() => warm(page.page - 1)} className={link}>
            <ChevronLeft className="size-3.5" aria-hidden /> Previous
          </ShallowLink>
        ) : (
          <span className={off} aria-disabled="true">
            <ChevronLeft className="size-3.5" aria-hidden /> Previous
          </span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">
          Page {page.page} of {pages}
        </span>
        {page.page < pages ? (
          <ShallowLink href={approvalsHref(view, { page: page.page + 1 })} onMouseEnter={() => warm(page.page + 1)} onFocus={() => warm(page.page + 1)} className={link}>
            Next <ChevronRight className="size-3.5" aria-hidden />
          </ShallowLink>
        ) : (
          <span className={off} aria-disabled="true">
            Next <ChevronRight className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
