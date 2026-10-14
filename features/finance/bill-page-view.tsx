import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { EmptyLine, LABEL, NUM, Section, SUB, TD, TH, TILE, VALUE } from "@/features/finance/finance-ui";
import {
  AGING,
  agingOf,
  compactMoney,
  daysUntil,
  dueLabel,
  FINANCE_ROOT,
  financeBillHref,
  financeVendorHref,
  qboBillUrl,
  shortDate,
  vendorKey,
} from "@/lib/finance";
import { originalLine } from "@/lib/finance-currency";
import { cn } from "@/lib/utils";
import type { BillDetail } from "@/types/finance";
import { formatCurrency, formatDate } from "@/utils/format";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-3 py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

const NOTE =
  "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm leading-relaxed";

/**
 * One bill, on its own page with the site's breadcrumb (SPEC-296, SPEC-301) — the
 * platform's drill-down pattern, not a drawer. Says in a sentence why the bill is
 * flagged, shows what the money is for and what has been paid against it, lists the
 * vendor's other open bills, and ends in the link to that transaction in QuickBooks —
 * with the one warning that link needs: it opens in whichever company the browser is in.
 */
export function BillPageView({ detail, todayISO }: { detail: BillDetail; todayISO: string }) {
  const { bill, lines, payments, otherOpen } = detail;
  const today = new Date(todayISO);
  const overdue = daysUntil(bill.dueOn, today);
  const bucket = AGING.find((a) => a.key === agingOf(bill, today));
  const paid = bill.amount - bill.balance;
  const duplicate = bill.flags.find((f) => f.kind === "duplicate");
  const unusual = bill.flags.find((f) => f.kind === "unusual");
  const discount = bill.flags.find((f) => f.kind === "discount");
  const isNew = bill.flags.some((f) => f.kind === "new_vendor");
  const vendorHref = financeVendorHref(vendorKey(bill.vendor));

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb
          current={bill.number}
          trail={[
            { label: "Accounts Payable", href: FINANCE_ROOT },
            { label: "Bills", href: `${FINANCE_ROOT}?tab=bills` },
          ]}
        />
        <PageHeader
          title={bill.vendor}
          description={`${bill.number} · ${bill.company} · ${bill.category}`}
          actions={
            <>
              <Button asChild variant="outline" size="sm">
                <Link prefetch={false} href={vendorHref}>All bills from this vendor</Link>
              </Button>
              <Button asChild size="sm">
                <a href={qboBillUrl(bill)} target="_blank" rel="noopener noreferrer">
                  Open in QuickBooks
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Button>
            </>
          }
        />
      </div>

      {duplicate && duplicate.kind === "duplicate" && (
        <div className={cn(NOTE, "border-destructive/40 bg-destructive/5")}>
          <StatusBadge tone="destructive">{duplicate.second ? "Possible second copy" : "Possible duplicate"}</StatusBadge>
          <p className="min-w-0 flex-1">
            Another open bill from {bill.vendor} in {bill.company} has the same amount, {formatCurrency(bill.amount)},
            entered within two weeks of this one. Check with the vendor before paying both.{" "}
            <Link prefetch={false} href={financeBillHref({ id: duplicate.otherId })} className="font-semibold underline">
              Open the other bill
            </Link>
          </p>
        </div>
      )}
      {unusual && unusual.kind === "unusual" && (
        <div className={cn(NOTE, "border-warning/40 bg-warning/5")}>
          <StatusBadge tone="warning">Unusual amount</StatusBadge>
          <p className="min-w-0 flex-1">
            {bill.vendor} usually bills around {formatCurrency(unusual.typical)}. This one is {formatCurrency(bill.amount)} —{" "}
            {Math.round(bill.amount / unusual.typical)}× that. Worth a look before it goes into a payment run.
          </p>
        </div>
      )}
      {discount && discount.kind === "discount" && (
        <div className={cn(NOTE, "border-success/40 bg-success/5")}>
          <StatusBadge tone="success">Early-pay discount</StatusBadge>
          <p className="min-w-0 flex-1">
            Terms are {bill.terms}: pay by <b>{shortDate(discount.deadline)}</b>
            {discount.daysLeft === 0 ? " (today)" : ` (${discount.daysLeft} ${discount.daysLeft === 1 ? "day" : "days"})`} and keep{" "}
            {formatCurrency(discount.save)}. After that the full {formatCurrency(bill.balance)} is due {shortDate(bill.dueOn)}.
          </p>
        </div>
      )}
      {isNew && (
        <div className={cn(NOTE, "border-ai/40 bg-ai/5")}>
          <StatusBadge tone="ai">New vendor</StatusBadge>
          <p className="min-w-0 flex-1">
            {bill.vendor} is new in the last 30 days. Worth confirming the bank details before the first payment goes out.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className={TILE}>
          <span className={cn(LABEL, "block")}>Remaining balance</span>
          <span className={cn(VALUE, "block")}>{formatCurrency(bill.balance)}</span>
          <span className={SUB}>of {compactMoney(bill.amount)} original</span>
        </div>
        <div className={TILE}>
          <span className={cn(LABEL, "block")}>Due</span>
          <span className={cn(VALUE, "block", overdue < 0 ? "text-destructive" : overdue <= 7 ? "text-warning" : "")}>
            {dueLabel(bill, today)}
          </span>
          <span className={SUB}>{formatDate(bill.dueOn)} · {bill.terms}</span>
        </div>
        <div className={TILE}>
          <span className={cn(LABEL, "block")}>Paid to date</span>
          <span className={cn(VALUE, "block")}>{formatCurrency(paid)}</span>
          <span className={SUB}>{payments.length ? `${payments.length} payment${payments.length === 1 ? "" : "s"}` : "nothing paid yet"}</span>
        </div>
        <div className={TILE}>
          <span className={cn(LABEL, "block")}>Aging</span>
          <span className={cn(VALUE, "block")}>{bucket?.label ?? "—"}</span>
          <span className={SUB}>by due date</span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <Section title="The bill" actions={<StatusBadge tone={bill.status === "partial" ? "info" : overdue < 0 ? "destructive" : "neutral"}>{bill.status === "partial" ? "Partially paid" : overdue < 0 ? "Past due" : "Open"}</StatusBadge>}>
            <dl>
              <Row label="Company"><StatusBadge tone="neutral">{bill.company}</StatusBadge></Row>
              <Row label="Bill number"><span className="font-mono">{bill.number}</span></Row>
              <Row label="Bill date">{formatDate(bill.billedOn)}</Row>
              <Row label="Due date">
                <span className={overdue < 0 ? "text-destructive" : ""}>{formatDate(bill.dueOn)} · {dueLabel(bill, today)}</span>
              </Row>
              <Row label="Terms">{bill.terms}</Row>
              <Row label="Expense account">{bill.category}</Row>
              <Row label="Original amount">{formatCurrency(bill.amount)}</Row>
              <Row label="Remaining balance"><span className="text-base font-bold">{formatCurrency(bill.balance)}</span></Row>
              {originalLine(bill) && <Row label="In QuickBooks">{originalLine(bill)}</Row>}
              <Row label="Memo"><span className="font-normal">{bill.memo || "—"}</span></Row>
            </dl>
          </Section>
          <Section title="Line items" meta={String(lines.length)}>
            {lines.length === 0 ? (
              <EmptyLine>No line detail was read for this bill.</EmptyLine>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={cn(TH, "text-left")}>Description</th>
                      <th className={cn(TH, "text-left")}>Account</th>
                      <th className={cn(TH, "text-right")}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-sm">{line.description}</td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">{line.account ?? "—"}</td>
                        <td className={cn(TD, NUM, "text-sm")}>{formatCurrency(line.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={2} className="px-3 py-2 text-xs font-bold">Total</td>
                      <td className={cn(TD, NUM, "text-xs font-bold")}>{formatCurrency(lines.reduce((t, l) => t + l.amount, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-3">
          <Section title="Payments against this bill">
            {payments.length === 0 ? (
              <EmptyLine>No payments yet.</EmptyLine>
            ) : (
              <ul>
                {payments.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0">
                    <span className="tabular-nums">{p.date ? formatDate(p.date) : "—"}</span>
                    <span className="text-muted-foreground">{p.method === "CreditCard" ? "Card" : p.method ?? "—"}</span>
                    <span className="ml-auto font-semibold tabular-nums">{formatCurrency(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title={`Other open bills · ${bill.vendor}`} meta={String(otherOpen.length)} actions={otherOpen.length > 0 ? <Link prefetch={false} href={vendorHref} className="text-xs text-muted-foreground hover:text-foreground">Vendor page →</Link> : undefined}>
            {otherOpen.length === 0 ? (
              <EmptyLine>None.</EmptyLine>
            ) : (
              <ul>
                {otherOpen.slice(0, 8).map((o) => (
                  <li key={o.id} className="border-b border-border last:border-0">
                    <Link prefetch={false} href={financeBillHref(o)} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-3 py-2 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50">
                      <span className="truncate text-sm font-semibold">{o.number} · {o.company}</span>
                      <span className="text-right text-sm font-semibold tabular-nums">{formatCurrency(o.balance)}</span>
                      <span className={cn("text-[11px]", o.days < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {o.days < 0 ? `${-o.days}d late` : o.days === 0 ? "due today" : `due ${shortDate(o.dueOn)}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Where this comes from">
            <div className="space-y-2 px-3 py-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Read from QuickBooks <b className="text-foreground">{bill.company}</b> on the last hourly read. Accounts Payable never
                writes to QuickBooks — pay or edit this bill there and it updates here on the next read.
              </p>
              <p className="text-xs">
                QuickBooks opens a link in whichever company your browser is signed into. If you&apos;re in another company, switch to{" "}
                {bill.company} first.
              </p>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
