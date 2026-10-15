"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";

import { RANGE_PRESETS, periodLabel, resolvePeriod, withParams } from "@/lib/restaurant";
import { cn } from "@/lib/utils";
import { dateToISO } from "@/utils/date";

/** The period every restaurant figure covers — URL state, presets of complete days. */
export function PeriodPicker() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = Object.fromEntries(params.entries());
  const period = resolvePeriod(current, dateToISO(new Date()));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarRange className="size-3.5" aria-hidden />
        {periodLabel(period.from, period.to)}
      </span>
      <div className="flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Period">
        {RANGE_PRESETS.map((preset) => {
          const active = period.range === preset.key;
          return (
            <Link
              key={preset.key}
              href={withParams(pathname, current, { range: preset.key, from: null, to: null })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {preset.key.toUpperCase()}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
