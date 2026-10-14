"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeTable } from "@/features/discounts/employee-table";
import { TransactionDetailView } from "@/features/discounts/transaction-detail";
import { TransactionsTable } from "@/features/discounts/transactions-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import type { ResolvedRange } from "@/lib/date-range";
import { discountQueries } from "@/lib/queries/discounts";

/** The Discount Monitoring drill-down pages, read from the client cache (SPEC-230). */

function DetailError({ what }: { what: string }) {
  return (
    <div className="p-4 md:p-6">
      <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        Couldn&apos;t load this {what}. Try again shortly.
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-96 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-96 rounded-card" />
    </main>
  );
}

export function EmployeeTransactionsView({ staffUserId, range, rq }: { staffUserId: number; range: ResolvedRange; rq: string }) {
  const result = useApiQuery(discountQueries.employeeTransactions(staffUserId, range.from, range.to));
  if (result.isPending) return <DetailSkeleton />;
  if (result.isError) return <DetailError what="employee" />;
  const data = result.data;
  const name = data.staff_name ?? `Staff ${staffUserId}`;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <Link
        href={`/discounts${rq}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Discounts
      </Link>
      <div>
        <h1 className="font-heading text-xl tracking-wide">{name} — discounted transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click a transaction to see the discounted items.
        </p>
      </div>
      <TransactionsTable transactions={data.transactions} rangeQuery={rq} />
    </main>
  );
}

export function LocationEmployeesView({ locationId, range, rq }: { locationId: number; range: ResolvedRange; rq: string }) {
  const id = locationId;
  const employeesQ = useApiQuery(discountQueries.employees(range.from, range.to, id));
  const overviewQ = useApiQuery(discountQueries.overview(range.from, range.to));
  if (employeesQ.isPending || overviewQ.isPending) return <DetailSkeleton />;
  if (employeesQ.isError || overviewQ.isError) return <DetailError what="location" />;
  const employees = employeesQ.data;
  const overview = overviewQ.data;
  const name = overview.locations.find((l) => l.location_id === id)?.location ?? `Location ${id}`;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <Link
        href={`/discounts${rq}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Discounts
      </Link>
      <div>
        <h1 className="font-heading text-xl tracking-wide">{name} — manual discounts by employee</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click an employee to see their discounted transactions. Outliers discount far above peers.
        </p>
      </div>
      <EmployeeTable employees={employees.employees} rangeQuery={rq} />
    </main>
  );
}

export function TransactionDetailPageView({ orderId, rq }: { orderId: number; rq: string }) {
  const result = useApiQuery(discountQueries.transaction(orderId));
  if (result.isPending) return <DetailSkeleton />;
  if (result.isError) {
    if (isNotFound(result.error)) notFound();
    return <DetailError what="transaction" />;
  }
  const detail = result.data;
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <Link
        href={`/discounts${rq}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Discounts
      </Link>
      <div>
        <h1 className="font-heading text-xl tracking-wide">Order {detail.order_number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Discount breakdown for this transaction.</p>
      </div>
      <TransactionDetailView detail={detail} />
    </main>
  );
}
