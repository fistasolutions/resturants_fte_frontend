import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatChange } from "@/utils/format";
import type { DeltaKind } from "@/types/ads";

/**
 * A single Performance Ads KPI tile (SPEC-111). `deltaKind` flips the good/bad
 * coloring for metrics where lower is better (e.g. CAC). Money values are
 * rendered `tabular-nums`. Status colors use `--success` / `--destructive`
 * tokens only — never brand red.
 */
export function KpiTile({
  label,
  value,
  delta,
  deltaKind = "up-good",
  hint,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaKind?: DeltaKind;
  hint?: string;
}) {
  const hasDelta = typeof delta === "number" && delta !== 0;
  const isGood = hasDelta && (deltaKind === "up-good" ? delta! > 0 : delta! < 0);
  const Arrow = hasDelta && delta! > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="gap-2 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-2xl tracking-wide tabular-nums">{value}</span>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
              isGood ? "text-success" : "text-destructive",
            )}
          >
            <Arrow className="size-3" aria-hidden />
            {formatChange(delta!)}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
