"use client";

import { ArrowRight, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

import { BriefPanel, BriefRow } from "@/features/brief/brief-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { foresightQueries } from "@/lib/queries/foresight";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

/** Morning Brief → Predictions (V4). Where the month is headed vs goal, as two rows in
 * the rail (SPEC-231). Fetched on its own through the client cache (SPEC-230) so it
 * never blocks the Brief: skeleton rows while the forecast loads, nothing at all if it
 * fails. Numbers are backend-computed (Foresight forecast, Rule 8). */
export function BriefPredictions() {
  const forecast = useApiQuery(foresightQueries.forecast());

  if (forecast.isError) return null;

  const aside = (
    <Link
      href="/foresight/forecast"
      className="inline-flex items-center gap-0.5 rounded outline-none underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      Forecast <ArrowRight className="size-3" aria-hidden />
    </Link>
  );

  if (forecast.isPending) {
    return (
      <BriefPanel title="Predictions" aside={aside}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-4 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </BriefPanel>
    );
  }

  const f = forecast.data;
  const behind = f.status === "behind";
  const tone = behind ? "text-warning" : f.has_goal ? "text-success" : "text-foreground";

  return (
    <BriefPanel title="Predictions" aside={aside}>
      {/* Pace to goal */}
      <BriefRow
        align="center"
        leading={<Target className="size-4 text-muted-foreground" aria-hidden />}
        trailing={
          <p className={cn("text-base font-bold leading-tight tracking-tight tabular-nums", tone)}>
            {formatCurrency(f.projected)}
          </p>
        }
      >
        <p className="text-sm font-semibold leading-snug">
          {f.has_goal ? "Pace to goal" : "Projected month-end"}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {f.has_goal
            ? behind
              ? `${formatCurrency(Math.abs(f.gap ?? 0))} short of your ${formatCurrency(f.goal ?? 0)} goal — needs ${formatCurrency(f.needed_per_day ?? 0)}/day.`
              : `on track for your ${formatCurrency(f.goal ?? 0)} goal (${f.pct_to_goal}%).`
            : `at ${formatCurrency(f.daily_rate)}/day this ${f.month_label}. Set a goal in Foresight.`}
        </p>
      </BriefRow>

      {/* Run rate */}
      <BriefRow
        align="center"
        leading={<TrendingUp className="size-4 text-muted-foreground" aria-hidden />}
        trailing={
          <p className="text-base font-bold leading-tight tracking-tight tabular-nums">
            {formatCurrency(f.mtd_revenue)}
          </p>
        }
      >
        <p className="text-sm font-semibold leading-snug">Revenue so far · {f.month_label}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {f.days_elapsed} of {f.days_in_month} days · {formatCurrency(f.daily_rate)}/day.
        </p>
      </BriefRow>
    </BriefPanel>
  );
}
