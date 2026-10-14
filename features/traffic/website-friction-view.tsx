"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, ChevronDown, ExternalLink } from "lucide-react";

import { TablePager } from "@/components/shared/table-pager";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTableControls } from "@/hooks/use-table-controls";
import { FRICTION_LABEL, emptyStateMessage, frictionBand } from "@/lib/clarity";
import { FRICTION_TABLE, frictionPageHref, frictionRate, issueLines, issueSummary, pluralise } from "@/lib/clarity-friction";
import { cn } from "@/lib/utils";
import type { ClarityFriction, ClarityFrictionPage } from "@/types/clarity";
import { formatCurrency, formatNumber } from "@/utils/format";

const BAND_TONE = {
  severe: "bg-destructive/10 text-destructive",
  notable: "bg-warning/15 text-warning",
  minor: "bg-muted text-muted-foreground",
} as const;

/** One issue, in words, with its way into Clarity. */
export function IssueRow({ line, windowDays }: { line: ReturnType<typeof issueLines>[number]; windowDays: number }) {
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-1 py-2" data-issue={line.key}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {pluralise(line.count, line.noun)}
          {!line.counted ? <span className="ml-2 text-xs font-normal text-muted-foreground">shown, not counted as friction</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">{line.meaning}</p>
      </div>
      {line.href ? (
        <a
          href={line.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Watch in Clarity
          <span className="sr-only"> — {pluralise(line.count, line.noun)}, last {windowDays} days</span>
        </a>
      ) : null}
    </li>
  );
}

/**
 * Broken pages, ordered by the money behind them (backend SPEC-219). Since
 * SPEC-282 every row opens: the chevron reveals each issue Clarity recorded, in
 * words, with a link into the store's own Clarity project filtered to that page.
 */
function FrictionRow({ page, windowDays, open, onToggle }: { page: ClarityFrictionPage; windowDays: number; open: boolean; onToggle: () => void }) {
  const band = frictionBand(page.frictionEvents, page.sessions);
  const lines = issueLines(page);
  const panelId = `friction-${page.handle}`;

  return (
    <div className={cn("rounded-card border border-border transition-colors", open ? "bg-muted/30" : "hover:bg-muted/40")} data-friction-row={page.handle}>
      <div className="flex flex-wrap items-center gap-4 p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? `Hide the issues on ${page.title}` : `Show the issues on ${page.title}`}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          data-friction-toggle
        >
          <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={frictionPageHref(page.handle)} className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline">
              {page.title}
            </Link>
            <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", BAND_TONE[band])}>
              {FRICTION_LABEL[band]}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{page.path}</p>
          <p className="mt-1 text-xs text-muted-foreground" data-friction-summary>
            {issueSummary(page)} · {pluralise(page.sessions, "session")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(page.revenue90d)}</span>
          <span className="text-xs text-muted-foreground">{formatNumber(page.units90d)} sold · 90d</span>
        </div>

        {page.clarity ? (
          <a
            href={page.clarity.recordings}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            data-friction-watch
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Watch
          </a>
        ) : null}
      </div>

      {/* the opening panel — grid-rows so it slides, never jumps (CSS only, 200 ms) */}
      <div
        id={panelId}
        className={cn("grid transition-[grid-template-rows] duration-200 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border px-4 pt-3 pb-4 md:pl-15">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                What Clarity recorded · last {windowDays} days
              </p>
              <p className="text-xs text-muted-foreground">
                {pluralise(page.frictionEvents, "friction event")} · {frictionRate(page)} per 100 sessions · scroll depth {Math.round(page.avgScrollDepth * 100)}%
              </p>
            </div>
            <ul className="mt-1 divide-y divide-border">
              {lines.map((line) => (
                <IssueRow key={line.key} line={line} windowDays={windowDays} />
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Link href={frictionPageHref(page.handle)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Open this page&apos;s friction
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
              {page.clarity ? (
                <a href={page.clarity.dashboard} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                  Clarity dashboard
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Add the Clarity project id on Integrations for links into the recordings.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The list with its own search, severity chips and pages (SPEC-258's controls);
 * its state lives here, so paging re-renders this card and nothing above it. */
function FrictionList({ pages, windowDays }: { pages: ClarityFrictionPage[]; windowDays: number }) {
  const t = useTableControls(pages, FRICTION_TABLE);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <TableToolbar
        noun="pages"
        facetLabel="Severity"
        query={t.query}
        onQuery={t.setQuery}
        facets={t.facets}
        facet={t.facet}
        onFacet={t.setFacet}
        matches={t.matches}
        total={t.total}
        active={t.active}
        onClear={t.clear}
        placeholder="Search a product or path…"
      />
      <div className="space-y-2 p-4">
        {t.rows.length === 0 ? (
          <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No page matches.</p>
        ) : (
          t.rows.map((page) => (
            <FrictionRow key={page.handle} page={page} windowDays={windowDays} open={open === page.handle} onToggle={() => setOpen((c) => (c === page.handle ? null : page.handle))} />
          ))
        )}
      </div>
      <TablePager page={t.page} pages={t.pages} pageSize={t.pageSize} matches={t.matches} noun="pages" onPage={t.setPage} />
    </>
  );
}

export function WebsiteFrictionView({ data, configured }: { data: ClarityFriction; configured: boolean }) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="p-4 pb-3 md:p-6 md:pb-3">
        <CardTitle>What is broken, and what it costs</CardTitle>
        <p className="text-sm text-muted-foreground">
          Every product page where visitors hit friction, ordered by the revenue behind the page — not by how loud the page is. Open a row for what Clarity recorded; every link lands on that page&apos;s recordings in your Clarity project.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {data.pages.length === 0 ? (
          <div className="m-4 flex items-center gap-2 rounded-card border border-dashed border-border p-6 text-sm text-muted-foreground">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {emptyStateMessage(data.connected, configured)}
          </div>
        ) : (
          <FrictionList pages={data.pages} windowDays={data.windowDays} />
        )}
      </CardContent>
    </Card>
  );
}
