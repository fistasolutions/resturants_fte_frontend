"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { StatusDot } from "@/components/shared/panel";
import { Button } from "@/components/ui/button";
import { PendingSection } from "@/features/report-fte/pending-section";
import { ReportSectionView } from "@/features/report-fte/report-section";
import { ScoreTiles } from "@/features/report-fte/score-tiles";
import { arrangeReport, blockCaption } from "@/lib/report-layout";
import { cn } from "@/lib/utils";
import type { ReportDraft, ReportSection } from "@/types/report-fte";

interface Props {
  draft: ReportDraft;
  /** Ids of sections that have landed — grounded or failed and saying so. */
  completed: ReadonlySet<string>;
  running: boolean;
  /** The full-page route; when given the header shows "Open full". */
  fullHref?: string;
  /** Reading width and larger type — the document page. */
  variant?: "composer" | "page";
}

/**
 * The report as a reader wants it (SPEC-286): the brief, the headline figures
 * together, the charts, the tables, then what to do. Sections that have not landed
 * stand in their place as skeletons of their kind. Nothing is computed here — the
 * arrangement is `lib/report-layout.ts`, the figures are the backend's.
 */
export function ReportDocument({ draft, completed, running, fullHref, variant = "composer" }: Props) {
  const arranged = arrangeReport(draft.sections, completed);
  const page = variant === "page";
  return (
    <article className={cn("flex flex-col", page ? "gap-8" : "gap-6")} aria-live="polite">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{draft.subtitle}</p>
          <h3 className={cn("font-semibold tracking-tight text-foreground", page ? "text-2xl" : "text-lg")}>{draft.title}</h3>
          <p className="text-[11px] text-muted-foreground">
            {draft.preparedFor} · {draft.computedAt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {arranged.landed} of {arranged.total} sections
          </span>
          {fullHref && !running && arranged.landed > 0 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={fullHref}>
                <Maximize2 className="size-3.5" aria-hidden /> Open full
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {arranged.brief ? (
        <p className="flex items-start gap-2 rounded-xl border border-ai/30 bg-ai/5 px-4 py-3 text-sm text-foreground">
          <GlispIcon className="mt-0.5 size-4 shrink-0 text-ai" aria-hidden />
          <span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-ai">In brief · </span>
            {arranged.brief}
          </span>
        </p>
      ) : null}

      {arranged.groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3" aria-label={group.heading}>
          <h4 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
            {group.heading}
            <span className="h-px flex-1 bg-border" aria-hidden />
          </h4>
          {group.key === "kpis" ? (
            <div className="flex flex-col gap-4">
              {group.sections.map((section) =>
                completed.has(section.id) ? (
                  <KpiBlock key={section.id} section={section} />
                ) : (
                  <PendingSection key={section.id} section={section} running={running} />
                ),
              )}
            </div>
          ) : (
            <div className={cn("flex flex-col", page ? "gap-8" : "gap-6")}>
              {group.sections.map((section) =>
                completed.has(section.id) ? (
                  <ReportSectionView key={section.id} section={section} />
                ) : (
                  <PendingSection key={section.id} section={section} running={running} />
                ),
              )}
            </div>
          )}
        </section>
      ))}
    </article>
  );
}

/** One KPI block inside the headline strip: caption, tool, the tiles, the note. */
function KpiBlock({ section }: { section: ReportSection }) {
  if (section.kind !== "kpis" || !section.kpis) return <ReportSectionView section={section} />;
  return (
    <div className="flex flex-col gap-2">
      <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
        {blockCaption(section)}
        <code className="rounded bg-ai/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ai">{section.tool}</code>
        <span className="inline-flex items-center gap-1.5 text-[10px]">
          <StatusDot tone={section.grounded ? "ok" : "warn"} />
          {section.grounded ? "grounded" : "could not be computed"}
        </span>
      </p>
      <ScoreTiles tiles={section.kpis} columns={4} label={section.title} />
      {section.note ? <p className="text-[11px] text-muted-foreground">{section.note}</p> : null}
    </div>
  );
}
