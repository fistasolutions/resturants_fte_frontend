"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TablePager } from "@/components/shared/table-pager";
import { VendorsSkeleton } from "@/features/finance/finance-skeleton";
import { EmptyLine, NUM, Section, TD, TH, Tile } from "@/features/finance/finance-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { PAGE_SIZE, financeVendorHref, pageOf } from "@/lib/finance";
import { financeQueries } from "@/lib/queries/finance";
import { cn } from "@/lib/utils";
import type { VendorRow } from "@/types/finance";
import { formatCurrency, formatDate, formatPercent } from "@/utils/format";

type VendorSort = "vendor" | "owed" | "pastDue" | "openBills" | "avgDaysToPay";

const COLUMNS: { key: VendorSort | null; label: string; num?: boolean }[] = [
  { key: "vendor", label: "Vendor" },
  { key: null, label: "Companies" },
  { key: "openBills", label: "Open bills", num: true },
  { key: "owed", label: "Owed", num: true },
  { key: "pastDue", label: "Past due", num: true },
  { key: null, label: "Next due", num: true },
  { key: null, label: "Terms" },
  { key: "avgDaysToPay", label: "Days to pay", num: true },
];

function termDays(terms: string | null): number | null {
  const match = terms?.match(/Net\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

/**
 * Vendors (SPEC-301): what each vendor is owed across every connected company — the total
 * QuickBooks splits by company — and how fast it is actually paid, from the year's paid
 * bills. A vendor paid in a way QuickBooks can't date says "no history", never a guess.
 */
export function VendorsTab() {
  const data = useApiQuery(financeQueries.vendors());
  const router = useRouter();
  const [sort, setSort] = useState<{ key: VendorSort; dir: 1 | -1 }>({ key: "owed", dir: -1 });
  const [page, setPage] = useState(1);

  if (data.isError) return <QueryErrorState error={data.error} onRetry={() => void data.refetch()} />;
  if (!data.data) return <VendorsSkeleton />;
  const report = data.data;
  const owed = report.vendors.filter((v) => v.owed > 0);

  const sorted = [...owed].sort((a, b) => {
    const x = a[sort.key];
    const y = b[sort.key];
    if (x === y) return a.vendor.localeCompare(b.vendor);
    if (x === null) return 1;
    if (y === null) return -1;
    return (x < y ? -1 : 1) * sort.dir;
  });
  const paged = pageOf(sorted, page, PAGE_SIZE);
  const press = (key: VendorSort) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "vendor" ? 1 : -1 }));
    setPage(1);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tile label="Vendors owed" value={report.summary.count} sub="across every company" />
        <Tile label="Shared vendors" value={report.summary.shared} sub="billing more than one company" />
        <Tile
          label="Top vendor share"
          value={report.summary.top ? formatPercent(report.summary.top.share * 100) : "—"}
          sub={report.summary.top?.vendor ?? "nothing owed"}
        />
        <Tile
          label="Avg days to pay"
          value={report.summary.avgDaysToPay === null ? "—" : `${report.summary.avgDaysToPay} days`}
          sub="paid bills, last 12 months"
        />
      </div>

      <Section title="Vendors" meta="what each vendor is owed across every company — the total no single QuickBooks company shows">
        {owed.length === 0 ? (
          <EmptyLine>{report.live ? "No vendor is owed anything." : "Nothing connected yet."}</EmptyLine>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr>
                    {COLUMNS.map((c) => (
                      <th
                        key={c.label}
                        className={cn(TH, c.num ? "text-right" : "text-left")}
                        aria-sort={c.key && sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                      >
                        {c.key ? (
                          <button
                            type="button"
                            onClick={() => press(c.key as VendorSort)}
                            className={cn("inline-flex items-center gap-1 uppercase tracking-widest outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring", c.num && "flex-row-reverse")}
                          >
                            {c.label}
                            {sort.key === c.key ? (sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />) : null}
                          </button>
                        ) : (
                          c.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.rows.map((v) => (
                    <VendorLine key={v.key} vendor={v} onOpen={() => router.push(financeVendorHref(v.key))} />
                  ))}
                </tbody>
              </table>
            </div>
            <TablePager page={paged.page} pages={paged.pages} pageSize={PAGE_SIZE} matches={sorted.length} noun="vendors" onPage={setPage} />
          </>
        )}
      </Section>
    </div>
  );
}

function VendorLine({ vendor: v, onOpen }: { vendor: VendorRow; onOpen: () => void }) {
  const terms = termDays(v.terms);
  return (
    <tr
      tabIndex={0}
      role="link"
      aria-label={`Open ${v.vendor}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="cursor-pointer border-b border-border outline-none transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50"
    >
      <td className="max-w-[16rem] px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{v.vendor}</span>
          {v.isNew && <StatusBadge tone="ai">New</StatusBadge>}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className="flex flex-wrap gap-1">
          {v.companies.map((c) => (
            <StatusBadge key={c} tone="neutral">{c}</StatusBadge>
          ))}
        </span>
      </td>
      <td className={cn(TD, NUM, "text-sm")}>{v.openBills}</td>
      <td className={cn(TD, NUM, "text-sm font-semibold")}>{formatCurrency(v.owed)}</td>
      <td className={cn(TD, NUM, "text-sm", v.pastDue > 0 ? "text-destructive" : "text-muted-foreground")}>
        {v.pastDue > 0 ? formatCurrency(v.pastDue) : "—"}
      </td>
      <td className={cn(TD, NUM, "text-sm")}>
        {v.nextDue ? (
          <>
            {formatDate(v.nextDue.date)}
            <span className="block text-[11px] text-muted-foreground">{formatCurrency(v.nextDue.balance)}</span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className={cn(TD, "text-sm")}>
        <span className="flex flex-wrap items-center gap-1">
          {v.terms ?? <span className="text-muted-foreground">—</span>}
          {v.terms?.startsWith("2/10") && <StatusBadge tone="success">2% discount</StatusBadge>}
        </span>
      </td>
      <td className={cn(TD, NUM, "text-sm")}>
        {v.avgDaysToPay === null ? (
          <span className="text-muted-foreground">no history</span>
        ) : (
          <>
            {v.avgDaysToPay} d
            <span className={cn("block text-[11px]", terms !== null && v.avgDaysToPay > terms ? "text-warning" : "text-muted-foreground")}>
              {terms !== null && v.avgDaysToPay > terms ? "slower than terms" : v.onTimeRate !== null ? `${Math.round(v.onTimeRate * 100)}% on time` : "within terms"}
            </span>
          </>
        )}
      </td>
    </tr>
  );
}
