import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { StatusDot, type DotTone } from "@/components/shared/panel";
import type { AlertTile, AlertTone } from "@/lib/dashboard-alerts";
import { cn } from "@/lib/utils";

const DOT_TONE: Record<AlertTone, DotTone> = { hi: "error", md: "warn", ai: "ai" };
const VALUE_TONE: Record<AlertTone, string> = {
  hi: "text-destructive",
  md: "text-warning",
  ai: "text-ai",
};

/**
 * The five inventory/returns alerts as one row of tiles (SPEC-233). Each tile is the
 * link its card's action was; an all-clear alert keeps its message and turns green.
 */
export function AlertStrip({ alerts }: { alerts: AlertTile[] }) {
  return (
    <div
      aria-label="Inventory and returns alerts"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
    >
      {alerts.map((alert) => (
        <Link
          key={alert.key}
          href={alert.href}
          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 rounded-xl border border-border bg-card px-3 py-2 outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="row-span-3 pt-1">
            <StatusDot tone={alert.allClear ? "ok" : DOT_TONE[alert.tone]} />
          </span>
          <span className="flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            <span className="truncate">{alert.label}</span>
            <ArrowUpRight className="size-3 shrink-0 text-muted-foreground/70" aria-hidden />
          </span>
          <span
            className={cn(
              "truncate text-[15px] font-bold leading-tight tracking-tight tabular-nums",
              alert.allClear ? "text-success" : VALUE_TONE[alert.tone],
            )}
          >
            {alert.allClear ? alert.allClearMessage : alert.value}
          </span>
          <span className="text-[11px] leading-snug text-muted-foreground">{alert.caption}</span>
        </Link>
      ))}
    </div>
  );
}
