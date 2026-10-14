"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichText } from "@/features/ci/rich-text";
import {
  areasOf,
  feedStats,
  filterReports,
  filtersFromParams,
  isDefaultFilters,
  KIND_LABEL,
  monthOptions,
  paginate,
  paramsFromFilters,
  type CiFilters,
  type CiKindFilter,
} from "@/lib/ci";
import type { CiReport } from "@/lib/ci/types";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

const KIND_PILL: Record<CiReport["kind"], string> = {
  engagement: "bg-brand/10 text-brand",
  weekly: "bg-ai/10 text-ai",
  daily: "bg-success/10 text-success",
};

const KIND_FILTERS: { key: CiKindFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "engagement", label: "Engagement" },
  { key: "weekly", label: "Weekly" },
  { key: "daily", label: "Daily" },
];

const LABEL = "text-[10px] font-semibold tracking-widest text-muted-foreground uppercase";
const CONTROL =
  "rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

function Kind({ kind }: { kind: CiReport["kind"] }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase", KIND_PILL[kind])}>
      {kind}
    </span>
  );
}

/** What the report delivered — its first areas by name — and the read affordance. */
function Delivered({ r, n }: { r: CiReport; n: number }) {
  const { titles, more } = areasOf(r, n);
  return (
    <div className="border-t border-border pt-3">
      <p className={LABEL}>What it delivered</p>
      <ul className="mt-1.5 space-y-1">
        {titles.map((t) => (
          <li key={t} className="flex gap-2 text-[13px] leading-snug">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
            <span className="line-clamp-1">
              <RichText text={t} />
            </span>
          </li>
        ))}
      </ul>
      {more > 0 ? <p className="mt-1 pl-3.5 text-[12px] text-muted-foreground">+{formatNumber(more)} more areas</p> : null}
    </div>
  );
}

function Foot({ r }: { r: CiReport }) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[11px] tracking-wide text-muted-foreground uppercase">
      {r.effort ? (
        <span>
          <b className="text-foreground">{r.effort}</b> effort
        </span>
      ) : null}
      <span>
        <b className="text-foreground">{r.views.replace(/ (screens?|views?)$/, "")}</b> screens
      </span>
      <span>
        <b className="text-foreground">{formatNumber(r.areas)}</b> areas
      </span>
      <span className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal text-foreground group-hover:underline">
        Read report <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </div>
  );
}

/** Reads like a report cover, then says what it delivered. */
function ReportCard({ r }: { r: CiReport }) {
  return (
    <Link
      href={`/ci/${r.id}`}
      className="group rounded-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full gap-3 p-5 transition-[transform,box-shadow,border-color] duration-150 group-hover:-translate-y-0.5 group-hover:border-foreground/20 group-hover:shadow-md">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{r.period}</span>
          <Kind kind={r.kind} />
        </div>
        <h3 className="font-heading text-xl leading-snug tracking-wide text-foreground">{r.hook}</h3>
        <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
          <RichText text={r.memo} />
        </p>
        <Delivered r={r} n={3} />
        <Foot r={r} />
      </Card>
    </Link>
  );
}

/** The engagement report's own four numbers (Jul 16 – Sep 18; revenue re-measured Sep 16). */
const ENGAGEMENT_NUMBERS: [string, string][] = [
  ["9 wks", "to deliver"],
  ["~97%", "build cost avoided"],
  ["$35.6M", "revenue under analysis"],
  ["505 h", "of build effort"],
];

/** The engagement report as the hero: the cover memo beside its four numbers. */
function HeroCard({ r }: { r: CiReport }) {
  return (
    <Link
      href={`/ci/${r.id}`}
      className="group col-span-full rounded-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="grid gap-6 border-brand/30 p-6 transition-[transform,box-shadow] duration-150 group-hover:-translate-y-0.5 group-hover:shadow-md md:grid-cols-[1.3fr_1fr] md:p-7">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{r.period}</span>
            <Kind kind={r.kind} />
          </div>
          <h3 className="font-heading text-3xl leading-tight tracking-wide text-foreground">{r.hook}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <RichText text={r.memo} />
          </p>
          <Foot r={r} />
        </div>
        <div className="grid grid-cols-2 content-start gap-3">
          {ENGAGEMENT_NUMBERS.map(([v, k]) => (
            <div key={k} className="rounded-xl border border-border p-3">
              <p className="text-xl font-bold tracking-tight tabular-nums">{v}</p>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{k}</p>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}

/**
 * The `/ci` feed (SPEC-253): counters, a filter bar (kind · month · search) and six
 * reports a page, all of it in the URL so a view can be shared. The engagement hero
 * leads the unfiltered first page; filtered, it is one card among the results.
 */
export function CiFeed({ reports }: { reports: CiReport[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = filtersFromParams(params);
  const requestedPage = Number(params.get("page") ?? "1");

  const stats = feedStats(reports);
  const months = monthOptions(reports);
  const matches = filterReports(reports, filters);
  const page = paginate(matches, requestedPage);
  const pristine = isDefaultFilters(filters) && page.page === 1;

  const go = useCallback(
    (next: CiFilters, nextPage: number) => {
      const qs = paramsFromFilters(next, nextPage).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  return (
    // Bottom padding keeps the page controls clear of the Ask Glisp pill.
    <div className="space-y-6 pb-16">
      <section aria-label="Reports summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Since", stats.since ? new Date(`${stats.since}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"],
          ["Reports", formatNumber(stats.reports)],
          ["Screens from the live app", formatNumber(stats.screens)],
          ["Kinds", "engagement · weekly · daily"],
        ].map(([k, v]) => (
          <Card key={k} className="gap-1 p-4">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{k}</p>
            <p className="text-lg font-bold tracking-tight">{v}</p>
          </Card>
        ))}
      </section>

      <section aria-label="Filter reports" className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Kind" className="flex rounded-lg border border-border bg-card p-0.5">
          {KIND_FILTERS.map((k) => {
            const on = filters.kind === k.key;
            return (
              <button
                key={k.key}
                type="button"
                aria-pressed={on}
                onClick={() => go({ ...filters, kind: k.key }, 1)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {k.label}
              </button>
            );
          })}
        </div>
        <Select value={filters.month} onValueChange={(v) => go({ ...filters, month: v }, 1)}>
          <SelectTrigger className="h-9 w-[180px]" aria-label="Month">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="ci-search"
            type="search"
            value={filters.q}
            onChange={(e) => go({ ...filters, q: e.target.value }, 1)}
            placeholder="Search reports and areas…"
            aria-label="Search reports"
            className="h-9 pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(page.total)} {page.total === 1 ? "report" : "reports"}
          {!isDefaultFilters(filters) ? (
            <button
              type="button"
              onClick={() => go({ kind: "all", month: "all", q: "" }, 1)}
              className="ml-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" aria-hidden /> Clear
            </button>
          ) : null}
        </p>
      </section>

      {page.items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-foreground">No report matches</p>
          <p className="mt-1 text-xs text-muted-foreground">Try another word, or clear the filters.</p>
        </Card>
      ) : (
        <section aria-label="Reports" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {page.items.map((r) =>
            r.kind === "engagement" && pristine ? <HeroCard key={r.id} r={r} /> : <ReportCard key={r.id} r={r} />,
          )}
        </section>
      )}

      {page.pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {page.page} of {page.pages} · {formatNumber(page.total)} reports
          </p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => go(filters, page.page - 1)} disabled={page.page <= 1} aria-label="Previous page" className={cn(CONTROL, "flex items-center gap-1")}>
              <ChevronLeft className="size-4" aria-hidden /> Prev
            </button>
            {Array.from({ length: page.pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => go(filters, n)}
                aria-current={n === page.page ? "page" : undefined}
                className={cn(CONTROL, "min-w-8 tabular-nums", n === page.page && "border-foreground bg-foreground text-background hover:text-background")}
              >
                {n}
              </button>
            ))}
            <button type="button" onClick={() => go(filters, page.page + 1)} disabled={page.page >= page.pages} aria-label="Next page" className={cn(CONTROL, "flex items-center gap-1")}>
              Next <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </nav>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {KIND_LABEL.engagement}s and build reports are the same documents delivered as PDFs, rendered here from their own sources.
      </p>
    </div>
  );
}
