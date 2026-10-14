import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import type { DiscountEmployee } from "@/types/discounts";

const HEAD = "text-right text-xs font-medium uppercase tracking-wide text-muted-foreground";

/** Per-employee manual-discount leaderboard (SPEC-098). Outliers (discounting
 * far above peers) are flagged. Unmapped staff show the raw Shopify id. */
export function EmployeeTable({
  employees,
  rangeQuery,
}: {
  employees: DiscountEmployee[];
  rangeQuery: string;
}) {
  if (employees.length === 0) {
    return (
      <div className="rounded-card bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
        No manual discounts entered here in this range.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Employee
              </TableHead>
              <TableHead className={HEAD}>Manual discounts</TableHead>
              <TableHead className={HEAD}>Total $</TableHead>
              <TableHead className={HEAD}>Avg</TableHead>
              <TableHead className={HEAD}>Max</TableHead>
              <TableHead className={HEAD}>% of their orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => {
              const href =
                e.staff_user_id !== null
                  ? `/discounts/employees/${e.staff_user_id}${rangeQuery}`
                  : null;
              const label = e.staff_name ?? (e.staff_user_id ? `Staff ${e.staff_user_id}` : "Unknown");
              return (
                <TableRow key={e.staff_user_id ?? "none"} className="relative hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {href ? (
                        <Link
                          href={href}
                          className="font-medium text-foreground outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {label}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{label}</span>
                      )}
                      {e.outlier ? (
                        <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">
                          outlier
                        </span>
                      ) : null}
                      {!e.mapped ? (
                        <span className="text-xs text-muted-foreground">unmapped</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(e.manual_orders)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(e.manual_amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.avg_discount === null ? "—" : formatCurrency(e.avg_discount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(e.max_discount)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {e.pct_orders_discounted === null ? "—" : formatPercent(e.pct_orders_discounted)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
