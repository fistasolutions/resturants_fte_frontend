"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopicCard } from "@/features/spotlight/topic-card";
import {
  ADDED_WINDOWS,
  addedCounts,
  applyAddedWindow,
  DEFAULT_ADDED_WINDOW,
  DEFAULT_INBOUND_QUERY,
  filterTopics,
  formatAddedOn,
  formatClicks,
  INBOUND_FILTERS,
  initialInboundFilter,
  inboundFilterCounts,
  sortTopics,
  topicPersonas,
  type AddedWindow,
  type InboundFilter,
  type InboundQuery,
  type InboundSort,
  type WindowedTopic,
} from "@/lib/inbound-topics";
import { INTENT_TEMPLATE_INTENTS, queryIntentLabel } from "@/lib/spotlight";
import { cn } from "@/lib/utils";
import type { InboundTopicsData } from "@/types/spotlight";
import { formatDate, formatDateTime, formatNumber } from "@/utils/format";

const SEG = "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Tile({ label, value, sub, className, children }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  return (
    <Card className={cn("gap-1 p-4", className)}>
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-bold tracking-tight">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      {children}
    </Card>
  );
}

function RunFact({ label, value }: { label: string; value: string }) {
  return (
    <span className="whitespace-nowrap">
      {label} <b className="font-semibold text-foreground">{value}</b>
    </span>
  );
}

/**
 * The Inbound Engine as topics (SPEC-277 / SPEC-279): where the money is first, then
 * the bank's topics as cards — searches a month, best rank, clicks to win, written or
 * not — each with one action. Research angles sit inside the topic they belong to,
 * every search is dated, and the Added window keeps earlier searches out of the
 * current list. Filters and search narrow without a request.
 */
export function InboundEngineTab({ data }: { data: InboundTopicsData }) {
  // SPEC-292: a link may open the tab on a filter (`?filter=gaps` from a competitor
  // card); the segments then own it as before.
  const initialFilter = initialInboundFilter(useSearchParams().get("filter"));
  const [q, setQ] = useState<InboundQuery>({ ...DEFAULT_INBOUND_QUERY, filter: initialFilter });
  const [added, setAdded] = useState<AddedWindow>(DEFAULT_ADDED_WINDOW);
  const [sort, setSort] = useState<InboundSort>("opportunity");
  const { summary, topics } = data;
  const windowed = useMemo(() => applyAddedWindow(topics, added, summary.today), [topics, added, summary.today]);
  const perWindow = useMemo(() => addedCounts(topics, summary.today), [topics, summary.today]);
  const counts = useMemo(() => inboundFilterCounts(windowed), [windowed]);
  const personas = useMemo(() => topicPersonas(topics), [topics]);
  const rows = useMemo(() => sortTopics(filterTopics(windowed, q), sort) as WindowedTopic[], [windowed, q, sort]);
  const active = q.filter !== "all" || q.intent !== null || q.persona !== null || q.text.trim() !== "";
  const hiddenTopics = topics.length - windowed.length;

  if (topics.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium">The query bank is empty.</p>
        <p className="mt-1 text-xs text-muted-foreground">It fills on the nightly refresh from your catalog, the Brand Brain personas and Search Console.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p aria-label="Bank run" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <RunFact label="Bank rebuilt" value={summary.rebuiltAt ? formatDateTime(summary.rebuiltAt) : "not yet on this host"} />
        <RunFact label="Google window" value={summary.windowStart && data.windowEnd ? `${formatAddedOn(summary.windowStart)} – ${formatDate(data.windowEnd)}` : "Search Console not connected"} />
        <RunFact label="Keyword Scout last added" value={summary.scoutLastAddedOn ? `${formatDate(summary.scoutLastAddedOn)} · ${formatNumber(summary.scoutLastAddedCount)} ${summary.scoutLastAddedCount === 1 ? "idea" : "ideas"}` : "nothing yet"} />
        <RunFact label="" value={`${formatNumber(summary.topics)} topics · ${formatNumber(summary.queries)} searches · ${formatNumber(summary.angles)} research angles${summary.brandDemand > 0 ? " · plus searches for the store by name" : ""}`} />
      </p>
      <section aria-label="Inbound summary" className="grid grid-cols-2 gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Tile
          label="Where the money is"
          className={cn(summary.pageTwoQueries > 0 && "border-l-4 border-l-warning")}
          value={summary.pageTwoQueries > 0 ? `${formatNumber(summary.pageTwoQueries)} searches sit on page two` : summary.gscQueries > 0 ? "Nothing on page two yet" : "Search Console not connected"}
          sub={
            summary.pageTwoQueries > 0
              ? `You rank 8–25 for them — ${formatClicks(summary.pageTwoClicks)} clicks a month one post away${summary.topQuery ? `. "${summary.topQuery.query}" alone is ${formatClicks(summary.topQuery.potentialClicks)}.` : "."}`
              : summary.gscQueries > 0
                ? "No search ranks 8–25 with enough impressions in the latest snapshot."
                : "Connect it on Integrations and the ranks appear here after the nightly pull."
          }
        >
          {summary.pageTwoQueries > 0 ? (
            <Button size="sm" className="mt-2 w-fit" onClick={() => setQ((c) => ({ ...c, filter: "p2" }))}>
              Show page-two topics →
            </Button>
          ) : null}
        </Tile>
        <Tile
          label="Real demand in the bank"
          value={summary.topicDemand > 0 ? `${formatNumber(summary.topicDemand)} / mo` : "—"}
          sub={
            (summary.brandDemand > 0
              ? `across the topics Google reported · ${formatNumber(summary.brandDemand)} / mo more are people searching for the store by name`
              : `across ${formatNumber(summary.gscQueries)} searches Google reported · ${formatNumber(summary.derived + summary.researched)} more from your catalog and research`) +
            (summary.competitorGaps > 0 ? ` · ${formatNumber(summary.competitorGaps)} from competitors' gaps` : "")
          }
        />
        <Tile label="Written · not yet" value={`${formatNumber(summary.written)} · ${formatNumber(summary.unwritten)}`} sub="topics with a post live or in review · topics with nothing" />
        <Tile
          label="New since last run"
          value={`${formatNumber(summary.newQueries)} ${summary.newQueries === 1 ? "search" : "searches"}`}
          sub={
            summary.newQueries > 0
              ? `added by the last rebuild across ${formatNumber(summary.newTopics)} ${summary.newTopics === 1 ? "topic" : "topics"} · ${formatNumber(summary.focusTopics)} in today's focus`
              : summary.scoutLastAddedOn
                ? `nothing new since the last rebuild · the Scout last added on ${formatDate(summary.scoutLastAddedOn)}`
                : "nothing new since the last rebuild"
          }
        >
          {summary.newQueries > 0 ? (
            <Button size="sm" variant="outline" className="mt-2 w-fit" onClick={() => { setAdded("today"); setSort("newest"); }}>
              Show what is new →
            </Button>
          ) : null}
        </Tile>
      </section>

      <section aria-label="Filter topics" className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Added</span>
        <div role="group" aria-label="Added" className="flex flex-wrap rounded-lg border border-border bg-card p-0.5">
          {ADDED_WINDOWS.map((w) => (
            <button key={w.key} type="button" aria-pressed={added === w.key} onClick={() => setAdded(w.key)} className={cn(SEG, added === w.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
              {w.label} <span className="ml-1 tabular-nums opacity-70">{formatNumber(perWindow[w.key])}</span>
            </button>
          ))}
        </div>
        <span className="ml-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Show</span>
        <div role="group" aria-label="Show" className="flex flex-wrap rounded-lg border border-border bg-card p-0.5">
          {INBOUND_FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={q.filter === f.key} onClick={() => setQ((c) => ({ ...c, filter: f.key as InboundFilter }))} className={cn(SEG, q.filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
              {f.label} <span className="ml-1 tabular-nums opacity-70">{formatNumber(counts[f.key])}</span>
            </button>
          ))}
        </div>
        <Select value={q.intent ?? "any"} onValueChange={(v) => setQ((c) => ({ ...c, intent: v === "any" ? null : v }))}>
          <SelectTrigger className="h-8 w-[140px]" aria-label="Intent">
            <SelectValue placeholder="Any intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any intent</SelectItem>
            {INTENT_TEMPLATE_INTENTS.map((i) => (
              <SelectItem key={i} value={i}>
                {queryIntentLabel(i)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {personas.length ? (
          <Select value={q.persona ?? "any"} onValueChange={(v) => setQ((c) => ({ ...c, persona: v === "any" ? null : v }))}>
            <SelectTrigger className="h-8 w-[200px]" aria-label="Persona">
              <SelectValue placeholder="Any persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any persona</SelectItem>
              {personas.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={q.text} onChange={(e) => setQ((c) => ({ ...c, text: e.target.value }))} placeholder="Search a topic or a phrase…" aria-label="Search topics" className="h-8 pl-8" />
        </div>
        {active || added !== DEFAULT_ADDED_WINDOW ? (
          <button type="button" onClick={() => { setQ(DEFAULT_INBOUND_QUERY); setAdded(DEFAULT_ADDED_WINDOW); }} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-3" aria-hidden /> Clear
          </button>
        ) : null}
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(rows.length)} {rows.length === 1 ? "topic" : "topics"}
          {hiddenTopics > 0 ? ` · ${formatNumber(hiddenTopics)} with nothing added in this window` : ""}
        </p>
        <Select value={sort} onValueChange={(v) => setSort(v as InboundSort)}>
          <SelectTrigger className="ml-auto h-8 w-[170px]" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opportunity">By opportunity</SelectItem>
            <SelectItem value="demand">By demand</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="unwritten">Not written first</SelectItem>
            <SelectItem value="name">By name</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">{windowed.length === 0 && added !== "all" ? "Nothing was added in this window." : "No topic matches."}</p>
          {windowed.length === 0 && added !== "all" ? (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setAdded("all")}>
              Show all time
            </Button>
          ) : null}
        </Card>
      ) : (
        <section aria-label="Topics" className="space-y-2">
          {rows.map((t, i) => (
            <TopicCard key={t.cluster} topic={t} defaultOpen={i === 0 && !active} onShowAllTime={() => setAdded("all")} />
          ))}
        </section>
      )}
      <p className="text-xs text-muted-foreground">
        Topics are ordered by opportunity: page-two gains first, then real demand, then what is not written. Added filters the searches by the day they entered the bank — a topic&apos;s counts follow the window, and a topic with nothing in it leaves the list. A Keyword Scout idea is filed under the topic it belongs to as a research angle, never as a topic of its own. Numbers come from Search Console and your catalog; Write this lands the article in Needs review.
      </p>
    </div>
  );
}
