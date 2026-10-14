import { LoaderCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { skeletonRows } from "@/lib/report-layout";
import type { ReportSection } from "@/types/report-fte";

/**
 * A section that has not landed yet (SPEC-286): a skeleton shaped like what is
 * coming — tiles, a table, bars or lines — under the section's own title and tool,
 * so the report fills in place rather than appearing all at once.
 */
export function PendingSection({ section, running }: { section: ReportSection; running: boolean }) {
  const rows = skeletonRows(section.kind);
  return (
    <section className="flex flex-col gap-2" aria-busy={running} aria-label={`${section.title} — ${running ? "computing" : "pending"}`}>
      <h4 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        {section.title}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          {section.tool}
        </code>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          {running ? <LoaderCircle className="size-3 animate-spin" aria-hidden /> : null}
          {running ? "computing…" : "pending"}
        </span>
      </h4>
      {section.kind === "kpis" ? (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card px-3 py-2">
              <Skeleton className="mb-2 h-2.5 w-16" />
              <Skeleton className="mb-1.5 h-5 w-20" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          ))}
        </div>
      ) : null}
      {section.kind === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex gap-3 bg-muted/40 px-3 py-2.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="ml-auto h-3 w-14" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex gap-3 border-t border-border px-3 py-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="ml-auto h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      ) : null}
      {section.kind === "bars" ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-32 shrink-0" />
              <Skeleton className="h-3" style={{ width: `${88 - i * 12}%` }} />
            </div>
          ))}
        </div>
      ) : null}
      {section.kind === "narrative" ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="h-3.5" style={{ width: `${96 - i * 9}%` }} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
