import { cn } from "@/lib/utils";
import type { RunOutcome } from "@/types/integrations";

const BAR: Record<RunOutcome, string> = {
  success: "h-3.5 bg-success/80",
  error: "h-5 bg-destructive",
  running: "h-2.5 bg-foreground/40 animate-pulse",
};

/** The last syncs, oldest to newest — a failure stands taller so it is seen. */
export function RunBars({ runs, className }: { runs: RunOutcome[]; className?: string }) {
  if (!runs.length) {
    return <span className={cn("text-xs text-muted-foreground", className)}>No syncs yet</span>;
  }
  const failed = runs.filter((r) => r === "error").length;
  return (
    <span
      role="img"
      aria-label={`Last ${runs.length} syncs: ${failed} failed`}
      className={cn("flex h-5 items-end gap-0.5", className)}
    >
      {runs.map((run, i) => (
        <span key={i} className={cn("w-[3px] rounded-full", BAR[run])} />
      ))}
    </span>
  );
}
