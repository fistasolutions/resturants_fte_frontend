import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration } from "@/lib/format-duration";
import { formatCurrency, formatDate } from "@/utils/format";
import type { GorgiasConversation } from "@/types/gorgias";

function StatusBadge({ status }: { status: string }) {
  const closed = status === "closed";
  const cls = closed
    ? "bg-success/10 text-success border-success/20"
    : "bg-warning/10 text-warning border-warning/20";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold border capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

/** Conversation Log table (SPEC-094) — one row per conversation, each a
 * stretched link to the thread detail (`returnTo` brings the breadcrumb back
 * to this exact tab + filters). */
export function ConversationsTable({
  conversations,
  returnTo,
}: {
  conversations: GorgiasConversation[];
  returnTo: string;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Response</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">CSAT</TableHead>
              <TableHead className="text-right">Cust. refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((c) => {
              const href = `/team-performance/conversations/${c.gorgias_ticket_id}?returnTo=${encodeURIComponent(
                returnTo,
              )}`;
              return (
                <TableRow key={c.gorgias_ticket_id} className="relative hover:bg-accent/50">
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {c.created_at ? formatDate(c.created_at) : "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={href}
                      className="font-medium text-foreground outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {c.customer_name ?? "Unknown"}
                    </Link>
                    {c.order_number ? (
                      <p className="text-xs text-muted-foreground">{c.order_number}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-[22rem]">
                    <p className="truncate text-foreground">{c.subject ?? "—"}</p>
                    {c.contact_reason ? (
                      <p className="truncate text-xs text-muted-foreground">{c.contact_reason}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {c.staff_name ?? c.agent_name ?? (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDuration(c.response_time_seconds)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.satisfaction_score === null ? "—" : c.satisfaction_score.toFixed(1)}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    title="This customer's total (all-time) Shopify refunds — matched by email"
                  >
                    {c.refund_amount === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : c.refund_amount > 0 ? (
                      <span className="font-medium text-warning">
                        {formatCurrency(c.refund_amount)}
                      </span>
                    ) : (
                      formatCurrency(0)
                    )}
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
