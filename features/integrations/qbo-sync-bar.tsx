import type { SyncView } from "@/lib/quickbooks-connection";
import { cn } from "@/lib/utils";

/**
 * One company's QuickBooks read, as a bar (SPEC-303): what it is doing, which of the
 * seven reads it is on, and how far it has got. A company waiting its turn shows an empty
 * track. Tokens only; the width eases between steps (a response to state, not an entrance).
 */
export function QboSyncBar({
  company,
  view,
  compact = false,
}: {
  company: string;
  view: SyncView;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-w-0", compact ? "w-44" : "w-full")}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="min-w-0 truncate font-medium text-foreground">{company}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{view.stepText}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${company}: ${view.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={view.percent}
        aria-valuetext={view.waiting ? view.label : `${view.stepText}, ${view.label}`}
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${view.waiting ? 0 : Math.max(view.percent, 4)}%` }}
        />
      </div>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">
        {view.label}
        {!view.waiting && view.heading === "First read" && " · first read"}
      </p>
    </div>
  );
}
