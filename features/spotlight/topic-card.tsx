"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GenerateDraftButton } from "@/features/spotlight/generate-draft-button";
import { formatAddedOn, formatClicks, rankLabel, rowSourceChip, rowSourceLabel, TOPIC_STATE_LABEL, topicAction, topicWriteRow, type WindowedTopic } from "@/lib/inbound-topics";
import { queryIntentLabel, querySourceLabel } from "@/lib/spotlight";
import { cn } from "@/lib/utils";
import type { InboundTopicRow } from "@/types/spotlight";
import { formatDate, formatNumber } from "@/utils/format";

const ROWS_FIRST = 8;

const STATE_TONE = {
  none: "bg-warning/15 text-warning",
  draft: "bg-ai/10 text-ai",
  published: "bg-success/10 text-success",
} as const;

const RANK_TONE = {
  p1: "bg-success/10 text-success",
  p2: "bg-destructive/10 text-destructive",
  far: "bg-muted text-muted-foreground",
  none: "bg-muted text-muted-foreground",
} as const;

const SOURCE_TONE: Record<string, string> = {
  search_console: "bg-success/10 text-success",
  researched: "bg-ai/10 text-ai",
  competitor_gap: "bg-ai/10 text-ai",
  derived: "bg-muted text-muted-foreground",
};

const CHIP = "rounded-md px-1.5 py-0.5 text-[10px] font-semibold";

function Stat({ value, label, tone }: { value: React.ReactNode; label: string; tone?: string }) {
  return (
    <div className="min-w-[88px] text-right">
      <p className={cn("text-sm font-bold tracking-tight tabular-nums", tone)}>{value}</p>
      <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function Row({ row }: { row: InboundTopicRow }) {
  const rank = rankLabel(row.position);
  const added = formatAddedOn(row.addedOn);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_100px_120px_110px_auto] items-center gap-3 border-b border-border px-4 py-2 pl-8 text-[13px] last:border-b-0" data-topic-row data-new={row.isNew ? "" : undefined}>
      <div className="min-w-0">
        <p className="truncate font-medium">{row.keyword}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {row.persona ? `${row.persona} · ` : ""}
          {added ? `added ${added} · ` : ""}
          {rowSourceLabel(row.source)}
        </p>
      </div>
      <div className="text-right tabular-nums">
        <p className="font-semibold">{row.volume === null ? "—" : formatNumber(row.volume)}</p>
        <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{row.volume === null ? "not measured" : "searches / mo"}</p>
      </div>
      <div className="text-right">
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", RANK_TONE[rank.tone])}>{rank.text}</span>
      </div>
      <div className="text-right tabular-nums">
        <p className="font-semibold">{row.potentialClicks === null ? "—" : formatClicks(row.potentialClicks)}</p>
        <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{row.potentialClicks === null ? (rank.tone === "p1" ? "already page 1" : "") : "clicks if page 1"}</p>
      </div>
      <div className="flex gap-1">
        <span className={cn(CHIP, "bg-muted font-medium")}>{queryIntentLabel(row.intent)}</span>
        {row.source !== "derived" ? <span className={cn(CHIP, "font-medium", SOURCE_TONE[row.source] ?? SOURCE_TONE.derived)}>{rowSourceChip(row.source, row.sourceRef)}</span> : null}
        {row.isNew ? <span className={cn(CHIP, "bg-foreground text-background")}>new</span> : null}
      </div>
    </div>
  );
}

/**
 * One topic on the Inbound Engine (SPEC-277 / SPEC-279): the four numbers a decision
 * needs and one action; the header opens the topic's searches — each dated, each
 * with its source, research angles folded in under the topic they belong to.
 */
export function TopicCard({ topic, defaultOpen = false, onShowAllTime }: { topic: WindowedTopic; defaultOpen?: boolean; onShowAllTime?: () => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const [all, setAll] = useState(false);
  const action = topicAction(topic);
  const writeRow = topicWriteRow(topic);
  const rank = rankLabel(topic.bestPosition);
  const rows = all ? topic.rows : topic.rows.slice(0, ROWS_FIRST);
  const more = topic.rows.length - ROWS_FIRST;
  const newest = formatAddedOn(topic.newestOn);

  return (
    <Card className={cn("gap-0 overflow-hidden p-0", topic.focus && "border-l-4 border-l-ai")} data-topic={topic.state}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="shrink-0 text-muted-foreground">{open ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}</span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn("text-sm font-bold", topic.kind === "topic" && "capitalize")}>{topic.kind === "brand" ? "Searches for the store by name" : topic.kind === "other" ? "Other searches" : topic.cluster}</span>
              <span className={cn(CHIP, SOURCE_TONE[topic.source])}>{topic.source === "researched" ? "Research only" : querySourceLabel(topic.source)}</span>
              {topic.source !== "competitor_gap" && topic.gapRefs.length > 0 ? (
                <span className={cn(CHIP, SOURCE_TONE.competitor_gap)} title="A topic an approved competitor publishes that you don't">gap · {topic.gapRefs.join(", ")}</span>
              ) : null}
              {topic.newCount > 0 ? <span className={cn(CHIP, "bg-foreground text-background")}>{formatNumber(topic.newCount)} new</span> : null}
              {topic.focus ? (
                <span className={cn(CHIP, "inline-flex items-center gap-1 bg-ai/10 text-ai")}>
                  <GlispIcon className="size-3" aria-hidden /> today&apos;s focus
                </span>
              ) : null}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {formatNumber(topic.queries)} {topic.queries === 1 ? "search" : "searches"}
              {topic.angles > 0 ? ` · ${formatNumber(topic.angles)} research ${topic.angles === 1 ? "angle" : "angles"}` : ""}
              {topic.kind !== "brand" ? `${topic.persona ? ` · ${topic.persona}` : ""} · ${queryIntentLabel(topic.intent).toLowerCase()}` : ""}
              {newest ? ` · newest ${newest}` : ""}
              {topic.kind === "brand" ? " · people who already know the store — not a topic to write" : topic.kind === "other" ? " · Google searches no category claimed" : ""}
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <Stat value={topic.volume > 0 ? formatNumber(topic.volume) : "—"} label={topic.volume > 0 ? "searches / mo" : "no volume yet"} />
          {topic.kind === "brand" ? (
            <Stat value="—" label="brand demand" />
          ) : (
            <>
              <Stat value={topic.bestPosition === null ? "—" : rank.text.split(" · ")[0]} label={topic.bestPosition === null ? "not ranking" : rank.tone === "p2" ? "best page-two rank" : "best rank"} tone={rank.tone === "p2" ? "text-destructive" : undefined} />
              <Stat value={topic.potentialClicks > 0 ? formatClicks(topic.potentialClicks) : topic.source === "researched" ? "ideas" : "—"} label={topic.potentialClicks > 0 ? "clicks a month to win" : topic.source === "researched" ? "unmeasured" : "cold start"} />
            </>
          )}
          <div className="flex items-center gap-2">
            {topic.kind !== "brand" ? (
              <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase", STATE_TONE[topic.state])}>
                {TOPIC_STATE_LABEL[topic.state]}
                {topic.state === "published" && topic.publishedAt ? ` · ${formatDate(topic.publishedAt)}` : ""}
              </span>
            ) : null}
            {action.kind === "write" && writeRow ? (
              writeRow.id !== null ? (
                <GenerateDraftButton queryId={writeRow.id} label="Write this" />
              ) : (
                <GenerateDraftButton keyword={writeRow.keyword} label="Write this" />
              )
            ) : action.kind === "open" && topic.draftId ? (
              <Button asChild size="sm" variant="outline" className="h-8">
                <Link href={`/spotlight/draft/${topic.draftId}`}>Open draft</Link>
              </Button>
            ) : action.kind === "reach" ? (
              <Button asChild size="sm" variant="outline" className="h-8">
                <Link href="/spotlight?tab=visibility">See reach</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border">
          {rows.map((r) => (
            <Row key={r.id ?? `gsc-${r.keyword}`} row={r} />
          ))}
          {more > 0 || topic.hiddenRows > 0 ? (
            <p className="flex flex-wrap gap-x-1 px-8 py-2 text-[11px] text-muted-foreground">
              {more > 0 && !all ? (
                <button type="button" onClick={() => setAll(true)} className="hover:text-foreground">
                  + {formatNumber(more)} more {more === 1 ? "search" : "searches"} in this topic · show all
                </button>
              ) : null}
              {more > 0 && !all && topic.hiddenRows > 0 ? <span aria-hidden>·</span> : null}
              {topic.hiddenRows > 0 ? (
                <button type="button" onClick={onShowAllTime} className="hover:text-foreground">
                  {formatNumber(topic.hiddenRows)} earlier {topic.hiddenRows === 1 ? "search is" : "searches are"} outside the Added window · show all time
                </button>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
