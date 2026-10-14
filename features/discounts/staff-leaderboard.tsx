"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmployeeTable } from "@/features/discounts/employee-table";
import type { DiscountEmployee } from "@/types/discounts";
import { formatCurrency, formatNumber } from "@/utils/format";

const PAGE_SIZE = 10;

/** Company-wide manual-discount leaderboard (SPEC-136, WHO). Reuses the per-location
 * `EmployeeTable` (no duplication) and paginates client-side — the set is bounded
 * (dozens of staff), so the page keeps the DOM light without a server round trip. */
export function StaffLeaderboard({
  employees,
  rangeQuery,
}: {
  employees: DiscountEmployee[];
  rangeQuery: string;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const start = current * PAGE_SIZE;
  const slice = employees.slice(start, start + PAGE_SIZE);

  const totalManual = employees.reduce((sum, e) => sum + e.manual_amount, 0);
  const outliers = employees.filter((e) => e.outlier).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-card p-4 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {formatNumber(employees.length)} staff entered{" "}
            {formatCurrency(totalManual)} in manual discounts
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ranked across all stores.{" "}
            {outliers > 0
              ? `${outliers} flagged as an outlier (discounting far above peers).`
              : "No outliers — everyone's in a similar range."}
          </p>
        </div>
      </div>

      <EmployeeTable employees={slice} rangeQuery={rangeQuery} />

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs text-muted-foreground tabular-nums">
            {start + 1}–{Math.min(start + PAGE_SIZE, employees.length)} of{" "}
            {formatNumber(employees.length)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {current + 1} / {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(current + 1)}
              disabled={current >= pages - 1}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
