import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { cn } from "@/lib/utils";
import { formatChange } from "@/utils/format";
import type { DeltaKind } from "@/types/spotlight";

/**
 * A single Spotlight KPI tile (SPEC-109). `deltaKind` flips the good/bad
 * coloring for metrics where lower is better (avg. search position). Status
 * colors use `--success` / `--destructive` tokens only — never brand red.
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
    <Card className="relative gap-2 p-4">
      <p className="pr-6 text-xs font-medium text-muted-foreground">{label}</p>
      <ExplainButton target={{ metric: label, value, delta: hasDelta ? delta : null, detail: hint }} />
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
