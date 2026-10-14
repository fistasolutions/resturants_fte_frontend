"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { ReportPeriod } from "@/types/reports";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

/** Daily / Weekly / Monthly toggle for the reports page (D-08). URL is the
 * source of truth (`?period=`), like the scope picker; "daily" is the default
 * and drops the param. Weekly/Monthly render a live rollup. */
export function PeriodToggle({ active }: { active: ReportPeriod }) {
  const router = useRouter();
  const params = useSearchParams();

  function select(period: ReportPeriod) {
    const next = new URLSearchParams(params.toString());
    if (period === "daily") next.delete("period");
    else next.set("period", period);
    const qs = next.toString();
    router.push(qs ? `/reports?${qs}` : "/reports");
  }

  return (
    <div
      role="group"
      aria-label="Report period"
      className="inline-flex rounded-lg border border-border p-0.5"
    >
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => select(key)}
          aria-pressed={active === key}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active === key
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
