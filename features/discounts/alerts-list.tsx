import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatPercent } from "@/utils/format";
import type { DiscountAlert } from "@/types/discounts";

import { ReasonBadge } from "./discount-badges";

function fmtDate(iso: string | null): string {
  return iso ? formatDateTime(iso) : "—"; // store (NY) time — SPEC-129
}

/** Policy-flagged discounts (SPEC-098) — red/yellow. NOT a manager-approval
 * record; these are threshold/outlier flags. Each links to the transaction. */
export function AlertsList({ alerts, rangeQuery }: { alerts: DiscountAlert[]; rangeQuery: string }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-card bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
        No discounts flagged by policy in this range — all clear.
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
                Date
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Order
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Employee
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Discount
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                %
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Flags
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((a) => (
              <TableRow key={a.order_id} className="relative hover:bg-accent/50">
                <TableCell className="text-sm text-muted-foreground">{fmtDate(a.created_at)}</TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link
                    href={`/discounts/transactions/${a.order_id}${rangeQuery}`}
                    className="outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {a.order_number}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{a.location}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {a.staff_name ?? (a.staff_user_id ? `Staff ${a.staff_user_id}` : "—")}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(a.discount)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {a.discount_pct === null ? "—" : formatPercent(a.discount_pct)}
                </TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-1">
                    {a.reasons.map((r) => (
                      <ReasonBadge key={r} reason={r} severity={a.severity} />
                    ))}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
