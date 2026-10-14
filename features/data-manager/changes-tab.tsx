"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDataManager } from "@/features/data-manager/data-manager-context";
import { ExampleNote } from "@/features/data-manager/parts";
import { cn } from "@/lib/utils";
import { formatDateTime, formatWholeMoney } from "@/utils/format";

/**
 * Changes (SPEC-374): what changed in a source since the last read, waiting for the owner. Applied
 * from today forward; sales already made keep the cost that was true when they sold.
 */
export function ChangesTab() {
  const { data, applied, apply } = useDataManager();
  const pending = data.pending;

  if (applied) {
    return (
      <div className="flex flex-col gap-4">
        <ExampleNote />
        <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center">
          <p className="text-sm font-semibold">Every change is applied</p>
          <p className="mt-1 text-xs text-muted-foreground">They count from today. Sales already made keep the cost they had.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ExampleNote />
      <div className="rounded-xl border border-border border-l-[3px] border-l-warning bg-card px-4 py-3 text-sm">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-warning">Waiting for you</p>
        <p className="mt-1">
          {pending.table} changed at {formatDateTime(pending.detectedAt)}: {pending.changes.length} changes. Applying them moves
          the last 30 days&apos; real profit by <b className="text-destructive">{formatWholeMoney(pending.profitEffect)}</b>.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Field</th>
              <th className="px-3 py-2 text-right">Was</th>
              <th className="px-3 py-2 text-right">Now</th>
            </tr>
          </thead>
          <tbody>
            {pending.changes.map((c) => (
              <tr
                key={`${c.key}-${c.field}`}
                className={cn(
                  "border-b border-border last:border-b-0",
                  c.kind === "added" && "bg-success/5",
                  c.kind === "removed" && "bg-destructive/5 text-muted-foreground",
                )}
              >
                <td className="px-3 py-2 font-mono text-xs">{c.key}</td>
                <td className={cn("px-3 py-2", c.kind === "removed" && "line-through")}>{c.label}</td>
                <td className="px-3 py-2">{c.field}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{c.was || "—"}</td>
                <td className={cn("px-3 py-2 text-right tabular-nums", c.kind === "changed" && "bg-warning/10 font-semibold")}>{c.now || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={apply}>
          <Check aria-hidden />
          Apply {pending.changes.length} changes
        </Button>
        <p className="text-xs text-muted-foreground">Applied from today. Sales already made keep the cost that was true when they sold.</p>
      </div>
    </div>
  );
}
