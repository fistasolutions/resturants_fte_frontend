import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { cn } from "@/lib/utils";

interface KpiStatProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  /** Tile accent (semantic-token classes), e.g. "bg-info/15 text-info". */
  tone?: string;
  /** Emphasise the hero stat (Profit Lost). */
  emphasis?: boolean;
}

/** One dense KPI tile — reused across the Overview band. Tokens only. */
export function KpiStat({ label, value, hint, icon: Icon, tone, emphasis }: KpiStatProps) {
  return (
    <Card className={cn("gap-2 p-4", emphasis && "ring-1 ring-destructive/30")}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <span className="flex items-center gap-1">
          <ExplainButton placement="inline" target={{ metric: label, value, detail: hint }} />
          {Icon && (
            <span className={cn("flex size-6 items-center justify-center rounded-md", tone)}>
              <Icon className="size-3.5" />
            </span>
          )}
        </span>
      </div>
      <p
        className={cn(
          "font-heading tabular-nums",
          emphasis ? "text-2xl text-destructive md:text-3xl" : "text-xl md:text-2xl",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
