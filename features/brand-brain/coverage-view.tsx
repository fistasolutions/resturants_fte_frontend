"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { HistoryView } from "@/features/brand-brain/history-view";
import { ConfirmButton } from "@/features/spotlight/brand-brain-rows";
import { ProvenanceChip } from "@/features/spotlight/provenance-chip";
import { brandBrainFreshness } from "@/lib/brand-brain-freshness";
import { brandBrainHref, coverageTone } from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
import type { BrandBrainEvent, CoverageData } from "@/types/brand-brain";
import { formatDate, formatNumber } from "@/utils/format";

const LABEL = "text-[11px] font-medium tracking-wide text-muted-foreground uppercase";
const TONE_TEXT = { success: "text-success", warning: "text-warning", destructive: "text-destructive" } as const;
const TONE_BAR = { success: "bg-success", warning: "bg-warning", destructive: "bg-destructive" } as const;

/** A stroke-drawn ring, in tokens — no conic gradient, no inline colour. */
function ScoreRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const tone = coverageTone(score === 100 ? 100 : Math.max(score, 1));
  return (
    <svg viewBox="0 0 100 100" className="size-28 shrink-0" role="img" aria-label={`Brand Brain ${score}% complete`}>
      <circle cx="50" cy="50" r={radius} className="fill-none stroke-muted" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        className={cn("fill-none stroke-current", TONE_TEXT[tone])}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[22px] font-bold tabular-nums">
        {score}%
      </text>
    </svg>
  );
}

/**
 * Brand Brain → Coverage (SPEC-263): what the writers can rely on, what is still
 * missing and where to add it, where the brain is used, and each section's progress.
 * Replaces the old "Brand DNA ready ✓" with a number that moves as you approve.
 */
export function CoverageView({ data, events = [], onChanged, nowMs }: { data: CoverageData; events?: BrandBrainEvent[]; onChanged: () => void; nowMs: number }) {
  const freshness = brandBrainFreshness(data.lastConfirmed, nowMs);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="gap-4 p-5">
          <div className="flex flex-wrap items-center gap-5">
            <ScoreRing score={data.score} />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">Brand Brain is {data.score}% complete</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                A section counts when it has an approved fact with a source and a confirmation younger than 90 days —
                that is what the writers can rely on.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  ["Facts approved", data.counts.approved, "text-foreground"],
                  ["Awaiting approval", data.counts.pending, data.counts.pending ? "text-warning" : "text-foreground"],
                  ["Sections empty", data.counts.empty, data.counts.empty ? "text-destructive" : "text-foreground"],
                ].map(([k, v, tone]) => (
                  <div key={k as string}>
                    <p className={LABEL}>{k as string}</p>
                    <p className={cn("text-lg font-bold tabular-nums", tone as string)}>{formatNumber(v as number)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              Last confirmed {freshness.relative} ({formatDate(data.lastConfirmed)})
              {freshness.stale ? <span className="rounded-md bg-warning/10 px-2 py-0.5 font-medium text-warning">overdue</span> : null}
            </p>
            <ConfirmButton onConfirmed={onChanged} />
          </div>
        </Card>

        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between px-5 py-3 text-sm font-semibold">
            Where the brain is used <span className="text-xs font-normal text-muted-foreground">last {data.usage.windowDays} days</span>
          </div>
          <dl className="divide-y divide-border border-t border-border text-sm">
            <div className="flex items-center justify-between px-5 py-3">
              <dt>Search Visibility articles written</dt>
              <dd className="font-semibold tabular-nums">{formatNumber(data.usage.drafts30d)}</dd>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <dt>Social posts created</dt>
              <dd className="font-semibold tabular-nums">{formatNumber(data.usage.socialPosts30d)}</dd>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-muted-foreground">
              <dt>Glisp answers, product pages</dt>
              <dd className="text-xs">read the same brain on every run</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between px-5 py-3 text-sm font-semibold">
            What is still missing <span className="text-xs font-normal text-muted-foreground">each row opens where you fix it</span>
          </div>
          {data.missing.length === 0 ? (
            <p className="border-t border-border px-5 py-8 text-center text-sm text-muted-foreground">
              Nothing missing — every section has a sourced, fresh fact.
            </p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {data.missing.map((m) => (
                <li key={m.key} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{m.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.why}</p>
                  </div>
                  <Link
                    href={brandBrainHref(m.tab)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium whitespace-nowrap outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {m.cta} <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between px-5 py-3 text-sm font-semibold">
            Sections <span className="text-xs font-normal text-muted-foreground">source mix</span>
          </div>
          <ul className="divide-y divide-border border-t border-border">
            {data.sections.map((s) => {
              const tone = coverageTone(s.progress);
              return (
                <li key={s.key} className="grid grid-cols-[1fr_5rem_auto] items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="min-w-0">
                    {s.label}
                    {s.stale ? <span className="ml-2 text-[11px] text-warning">{s.stale} stale</span> : null}
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${s.progress}%`}>
                    <span className={cn("block h-full rounded-full", TONE_BAR[tone])} style={{ width: `${s.progress}%` }} />
                  </span>
                  <span className="flex flex-wrap justify-end gap-1">
                    {s.status === "empty" ? (
                      <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">empty</span>
                    ) : (
                      s.sources.map((src) => <ProvenanceChip key={src} source={src} />)
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* History folded in (SPEC-281): the latest changes, with Show all for the rest. */}
      <HistoryView events={events} title="Recent changes" subtitle="who, when, from what — newest first" limit={8} />
    </div>
  );
}
