import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ticketAge } from "@/lib/ticket-age";
import { formatCurrency } from "@/utils/format";
import type { GorgiasRevenueAtRiskCustomer, GorgiasRiskKind } from "@/types/gorgias";

const RISK: Record<GorgiasRiskKind, { label: string; cls: string }> = {
  unanswered: {
    label: "Unanswered",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
  },
  over_24h: { label: "Open > 24h", cls: "bg-warning/10 text-warning border-warning/20" },
  unhappy: { label: "Unhappy", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

function RiskBadge({ kind }: { kind: GorgiasRiskKind }) {
  const r = RISK[kind];
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold border ${r.cls}`}
    >
      {r.label}
    </span>
  );
}

const HEAD = "text-right text-xs font-medium uppercase tracking-wide text-muted-foreground";

/** Ranked at-risk customers (SPEC-096 ①) — highest lifetime value first, each
 * row a stretched link to the conversation so the client can act on the most
 * valuable waiting/unhappy customers immediately. */
export function RevenueAtRiskTable({
  customers,
  returnTo,
}: {
  customers: GorgiasRevenueAtRiskCustomer[];
  returnTo: string;
}) {
  const nowISO = new Date().toISOString();
  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className={HEAD}>Lifetime value</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Issue
              </TableHead>
              <TableHead className={HEAD}>Waiting</TableHead>
              <TableHead className={HEAD}>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => {
              const href = `/team-performance/conversations/${c.gorgias_ticket_id}?returnTo=${encodeURIComponent(
                returnTo,
              )}`;
              const age = ticketAge(c.created_at, nowISO);
              return (
                <TableRow key={c.gorgias_ticket_id} className="relative hover:bg-accent/50">
                  <TableCell>
                    <Link
                      href={href}
                      className="font-medium text-foreground outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {c.customer_name ?? "Unknown customer"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(c.total_spent)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm text-foreground">{c.subject ?? "—"}</p>
                    {c.contact_reason ? (
                      <p className="truncate text-xs text-muted-foreground">{c.contact_reason}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {age ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <RiskBadge kind={c.risk_kind} />
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
