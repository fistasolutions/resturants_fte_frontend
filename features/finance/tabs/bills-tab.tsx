"use client";

import { useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { Input } from "@/components/ui/input";
import { BillsTable } from "@/features/finance/bills-table";
import { BillsSkeleton } from "@/features/finance/finance-skeleton";
import { Section } from "@/features/finance/finance-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  AGING,
  EMPTY_FILTERS,
  GROUP_OPTIONS,
  WINDOWS,
  filterBills,
  filtersFromParams,
  financeHref,
  sumBalance,
} from "@/lib/finance";
import { financeQueries } from "@/lib/queries/finance";
import { cn } from "@/lib/utils";
import type { BillFilters } from "@/types/finance";
import { formatCurrency, formatNumber } from "@/utils/format";

const SELECT =
  "h-7 min-w-28 rounded-[10px] border border-border bg-card px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** The saved views — the lists the owner opens every day, one click each. */
const VIEWS: { label: string; filters: Partial<BillFilters> }[] = [
  { label: "All open", filters: {} },
  { label: "Past due", filters: { window: "past" } },
  { label: "Due · 7 days", filters: { window: "7" } },
  { label: "Due · 30 days", filters: { window: "30" } },
  { label: "Partially paid", filters: { status: "partial" } },
  { label: "Flagged", filters: { watch: true } },
];

const SAVED_KEYS = ["company", "window", "age", "vendor", "status", "q", "watch"] as const;

/**
 * Bills (SPEC-301): the client's list, every column he asked for. The whole payable is in
 * the cache already (it is the Overview's read), so every view, filter and grouping
 * narrows it in the browser — no request, one frame. The filters live in the URL.
 */
export function BillsTab() {
  const params = useSearchParams();
  const search = params.toString();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(search)), [search]);
  const today = useMemo(() => new Date(), []);
  const ap = useApiQuery(financeQueries.ap(), { placeholderData: keepPreviousData });
  const typing = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (ap.isError) return <QueryErrorState error={ap.error} onRetry={() => void ap.refetch()} />;
  if (!ap.data) return <BillsSkeleton />;
  const overview = ap.data;
  const rows = filterBills(overview.bills, filters, today);

  const href = (patch: Partial<BillFilters>) => financeHref("bills", { ...filters, ...patch });
  const replace = (patch: Partial<BillFilters>) => window.history.replaceState(null, "", href(patch));
  const isView = (view: Partial<BillFilters>) =>
    SAVED_KEYS.every((key) => filters[key] === ({ ...EMPTY_FILTERS, ...view } as BillFilters)[key]);

  const chips: { key: keyof BillFilters; label: string }[] = [];
  if (filters.company !== "all") chips.push({ key: "company", label: filters.company });
  if (filters.window !== "all") chips.push({ key: "window", label: WINDOWS.find((w) => w.key === filters.window)?.label ?? "" });
  if (filters.age) chips.push({ key: "age", label: AGING.find((a) => a.key === filters.age)?.label ?? "" });
  if (filters.vendor !== "all") chips.push({ key: "vendor", label: filters.vendor });
  if (filters.status !== "all") chips.push({ key: "status", label: filters.status === "partial" ? "Partially paid" : "Unpaid" });
  if (filters.watch) chips.push({ key: "watch", label: "Flagged" });

  const emptyLine = !overview.live
    ? "Nothing connected yet — connect a QuickBooks company to see what it owes."
    : overview.totals.outstandingBills === 0
      ? "Nothing outstanding. Every bill in QuickBooks is paid."
      : undefined;

  return (
    <div className="space-y-3">
      <nav aria-label="Saved views" className="flex flex-wrap gap-1.5">
        {VIEWS.map((view) => {
          const on = isView(view.filters);
          return (
            <ShallowLink
              key={view.label}
              href={financeHref("bills", { ...EMPTY_FILTERS, group: filters.group, ...view.filters })}
              aria-current={on ? "true" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {view.label}
            </ShallowLink>
          );
        })}
      </nav>

      <Section
        title="Bills"
        meta={`${formatNumber(rows.length)} of ${formatNumber(overview.totals.outstandingBills)} · ${formatCurrency(sumBalance(rows))}`}
        actions={
          <>
            {chips.map((chip) => (
              <ShallowLink
                key={chip.key}
                href={href({ [chip.key]: EMPTY_FILTERS[chip.key] })}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Remove filter: ${chip.label}`}
              >
                {chip.label} <X className="size-3" aria-hidden />
              </ShallowLink>
            ))}
            <select className={SELECT} value={filters.company} aria-label="Company" onChange={(e) => replace({ company: e.target.value })}>
              <option value="all">All companies</option>
              {overview.companies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className={cn(SELECT, "min-w-32")} value={filters.vendor} aria-label="Vendor" onChange={(e) => replace({ vendor: e.target.value })}>
              <option value="all">All vendors</option>
              {overview.vendors.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select className={SELECT} value={filters.group} aria-label="Group by" onChange={(e) => replace({ group: e.target.value as BillFilters["group"] })}>
              {GROUP_OPTIONS.map((g) => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>
            <span className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                key={filters.q === "" ? "empty" : "q"}
                defaultValue={filters.q}
                onChange={(e) => {
                  const value = e.target.value;
                  if (typing.current) clearTimeout(typing.current);
                  typing.current = setTimeout(() => replace({ q: value }), 200);
                }}
                placeholder="Vendor, bill no., memo…"
                aria-label="Search bills"
                className="h-7 w-full pl-7 text-xs sm:w-52"
              />
            </span>
          </>
        }
      >
        <BillsTable key={search} bills={rows} today={today} group={filters.group} empty={emptyLine} />
      </Section>
    </div>
  );
}
