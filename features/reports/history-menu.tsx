"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReportListItem } from "@/types/reports";
import { formatDate } from "@/utils/format";

interface HistoryMenuProps {
  reports: ReportListItem[];
  activeDate: string | null;
}

/** Compact report history (SPEC-025 Patches): a header dropdown instead of a
 * permanent side rail — the report keeps the full content width. */
export function HistoryMenu({ reports, activeDate }: HistoryMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarDays className="size-4" aria-hidden />
          {activeDate ? formatDate(activeDate) : "History"}
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      {/* Latest 5 only; the full archive lives on /reports/history (SPEC-035) */}
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Recent reports
        </DropdownMenuLabel>
        {reports.length === 0 ? (
          <DropdownMenuItem disabled>No reports yet</DropdownMenuItem>
        ) : (
          reports.slice(0, 5).map((report) => (
            <DropdownMenuItem key={report.report_date} asChild>
              <Link
                href={`/reports?date=${report.report_date}`}
                className="flex items-center justify-between"
              >
                {formatDate(report.report_date)}
                {report.report_date === activeDate && (
                  <Check className="size-3.5" aria-hidden />
                )}
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/reports/history" className="flex items-center justify-between">
            Show more
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
