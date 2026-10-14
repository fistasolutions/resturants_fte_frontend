"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { reportPageHref } from "@/lib/report-fte-tabs";
import type { ScheduleCadence } from "@/types/report-fte";
import { formatDateTime } from "@/utils/format";

const HEADING: Record<ScheduleCadence, string> = {
  daily: "Scheduled daily reports",
  weekly: "Scheduled weekly reports",
  monthly: "Scheduled monthly reports",
};

/**
 * Report FTE schedules the owner chose to show here (SPEC-335 / backend SPEC-343): each run
 * of a daily, weekly or monthly schedule, under the matching tab, opening the full report.
 * Hidden when there are none — or when this member cannot see the Report FTE.
 */
export function ScheduledReportsCard({ cadence }: { cadence: ScheduleCadence }) {
  const feed = useApiQuery(reportFteQueries.onReports(cadence));
  if (!feed.data || feed.data.items.length === 0) return null;
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold">{HEADING[cadence]}</h2>
        <span className="text-xs text-muted-foreground">from the Report Builder</span>
      </div>
      <ul className="divide-y divide-border">
        {feed.data.items.map((item) => (
          <li key={item.id}>
            <Link
              href={reportPageHref(item.id)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.ranAt ? formatDateTime(item.ranAt) : "—"}
                  {item.sentTo.length ? ` · sent to ${item.sentTo.join(", ")}` : " · in the app"}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
