"use client";

import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { EmptyLine, FlagChips, NUM, Section, ShareBar, TD, TH, Tile } from "@/features/finance/finance-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { EMPTY_FILTERS, FINANCE_ROOT, financeBillHref, financeHref, shortDate } from "@/lib/finance";
import { financeQueries } from "@/lib/queries/finance";
import { cn } from "@/lib/utils";
import type { VendorDetail } from "@/types/finance";
import { formatCurrency, formatDate, formatPercent } from "@/utils/format";

/** The vendor page's own skeleton — header included, since this page owns its header. */
export function VendorSkeleton() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6" aria-busy="true" aria-label="Loading the vendor">
      <Skeleton className="h-4 w-72 rounded-md" />
      <Skeleton className="h-9 w-80 rounded-md" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    </main>
  );
}

/**
 * One vendor across every company (SPEC-301 / backend SPEC-295) — its own page with the
 * breadcrumb. One vendor, every set of books, one total: what it is owed, how it splits
 * by company, its open bills, and how its bills have actually been paid.
 */
export function VendorView({ vendorKey }: { vendorKey: string }) {
  const query = useApiQuery(financeQueries.vendor(vendorKey));
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <VendorSkeleton />;
  return <VendorPage detail={query.data} />;
}

function VendorPage({ detail }: { detail: VendorDetail }) {
  const v = detail.vendor;
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb
          current={v.vendor}
          trail={[
            { label: "Accounts Payable", href: FINANCE_ROOT },
            { label: "Vendors", href: `${FINANCE_ROOT}?tab=vendors` },
          ]}
        />
        <PageHeader
          title={v.vendor}
          description={[v.terms, v.companies.length ? `billing ${v.companies.join(", ")}` : null, v.isNew ? "new in the last 30 days" : null]
            .filter(Boolean)
            .join(" · ")}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link prefetch={false} href={financeHref("bills", { ...EMPTY_FILTERS, vendor: v.vendor })}>See these bills in Bills</Link>
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tile label="Owed" value={formatCurrency(v.owed)} sub={`${v.openBills} open ${v.openBills === 1 ? "bill" : "bills"}`} />
        <Tile label="Past due" value={formatCurrency(v.pastDue)} tone={v.pastDue > 0 ? "bad" : null} sub={v.nextDue ? `next due ${shortDate(v.nextDue.date)}` : "nothing upcoming"} />
        <Tile label="Typical bill" value={v.typical === null ? "—" : formatCurrency(v.typical)} sub="median, last 12 months" />
        <Tile
          label="Days to pay"
          value={v.avgDaysToPay === null ? "—" : `${v.avgDaysToPay} days`}
          sub={v.onTimeRate === null ? "no payment history" : `${formatPercent(v.onTimeRate * 100)} on time · ${v.measuredBills} bills`}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="Open bills" meta={String(detail.bills.length)}>
          {detail.bills.length === 0 ? (
            <EmptyLine>Nothing owed to {v.vendor} right now.</EmptyLine>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <th className={cn(TH, "text-left")}>Bill no.</th>
                    <th className={cn(TH, "text-left")}>Company</th>
                    <th className={cn(TH, "text-right")}>Due</th>
                    <th className={cn(TH, "text-right")}>Balance</th>
                    <th className={cn(TH, "text-left")}><span className="sr-only">Flags</span></th>
                  </tr>
                </thead>
                <tbody>
                  {detail.bills.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className={cn(TD, "font-mono text-xs")}>
                        <Link prefetch={false} href={financeBillHref(b)} className="font-semibold hover:underline">{b.number}</Link>
                      </td>
                      <td className={TD}><StatusBadge tone="neutral">{b.company}</StatusBadge></td>
                      <td className={cn(TD, NUM, "text-sm", b.days < 0 ? "font-semibold text-destructive" : b.days <= 7 ? "text-warning" : "")}>
                        {formatDate(b.dueOn)}
                        <span className="block text-[11px] font-normal">{b.days < 0 ? `${-b.days}d late` : b.days === 0 ? "due today" : `in ${b.days}d`}</span>
                      </td>
                      <td className={cn(TD, NUM, "text-sm font-semibold")}>{formatCurrency(b.balance)}</td>
                      <td className="px-3 py-2"><FlagChips flags={b.flags} amount={b.amount} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <div className="space-y-3">
          <Section title="Split by company">
            <ul className="space-y-2.5 p-3">
              {detail.byCompany.map((c) => (
                <li key={c.company}>
                  <span className="flex justify-between gap-3 text-sm">
                    <b>{c.company}</b>
                    <span className="tabular-nums">{c.owed > 0 ? formatCurrency(c.owed) : "—"}</span>
                  </span>
                  <ShareBar className="mt-1" parts={[[v.owed ? (c.owed / v.owed) * 100 : 0, "bg-foreground"]]} />
                </li>
              ))}
            </ul>
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              One vendor, every set of books. QuickBooks shows each company its own share; this is the total you owe.
            </p>
          </Section>
          <Section title="Payments" meta="most recent first">
            {detail.payments.length === 0 ? (
              <EmptyLine>No payments in the last year.</EmptyLine>
            ) : (
              <ul>
                {detail.payments.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0">
                    <span className="tabular-nums">{p.date ? formatDate(p.date) : "—"}</span>
                    <StatusBadge tone="neutral">{p.company}</StatusBadge>
                    <span className="ml-auto font-semibold tabular-nums">{formatCurrency(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </main>
  );
}
