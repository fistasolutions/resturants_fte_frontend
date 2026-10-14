"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { TablePager } from "@/components/shared/table-pager";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FitSkeleton } from "@/features/fit/fit-skeleton";
import {
  ConfidenceText,
  LeanBar,
  NUM,
  StyleThumb,
  TD,
  TH,
  Tile,
  VerdictBadge,
} from "@/features/fit/fit-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  FIT_PAGE_SIZE,
  VERDICT_FILTERS,
  countFor,
  coverageLabel,
  filterStyles,
  fitHref,
  fitStyleHref,
  pageOf,
  sortStyles,
  sortedBy,
  verdictFilterLabel,
  viewFromParams,
  type FitSortKey,
  type FitView as ViewState,
} from "@/lib/fit";
import { clientApi } from "@/lib/client-api";
import { fitQueries } from "@/lib/queries/fit";
import { cn } from "@/lib/utils";
import type { FitOverview, FitVendor } from "@/types/fit";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/utils/format";

const VENDORS_SHOWN = 8;

/**
 * Products → Fit (SPEC-306). Which way each style fits, read from the reasons customers
 * gave for returns and the sizes they exchanged to (backend SPEC-303). The overview is
 * read once and narrowed here; every chip, sort and page moves the URL in place.
 */
export function FitView() {
  const query = useApiQuery(fitQueries.overview());
  const hydrated = useHydrated();
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data || !hydrated) return <FitSkeleton />;
  return <FitPage data={query.data} />;
}

function FitPage({ data }: { data: FitOverview }) {
  const params = useSearchParams();
  const view = viewFromParams(new URLSearchParams(params.toString()));
  const { summary } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile
          label="Returns about fit"
          value={summary.fitShare === null ? "—" : formatPercent(summary.fitShare * 100)}
          sub={`${formatNumber(summary.fitReturns)} of ${formatNumber(summary.returns)} returns`}
        />
        <Tile
          label="Refunded on fit"
          value={formatCompactCurrency(summary.fitRefund)}
          sub="money back on fit returns"
          tone="bad"
        />
        <Tile label="Runs small" value={formatNumber(summary.runsSmall)} sub="styles · size up" tone="warn" />
        <Tile label="Runs large" value={formatNumber(summary.runsLarge)} sub="styles · size down" tone="info" />
        <Tile label="Fit varies" value={formatNumber(summary.inconsistent)} sub="styles · check the chart" />
      </div>
      <p className="text-xs text-muted-foreground">
        Read from {formatNumber(summary.returns)} Loop returns {coverageLabel(data.coverage.start)} and the sizes
        customers exchanged to. A style needs at least {data.rules.minFitReturns} fit returns before it gets a
        verdict; {formatNumber(summary.notEnough)} {summary.notEnough === 1 ? "style is" : "styles are"} still below
        that.
      </p>
      <VendorsCard vendors={data.vendors} view={view} />
      <StylesCard data={data} view={view} />
    </div>
  );
}

function VendorsCard({ vendors, view }: { vendors: FitVendor[]; view: ViewState }) {
  const [all, setAll] = useState(false);
  const withFit = vendors.filter((v) => v.fitReturns > 0);
  const shown = all ? withFit : withFit.slice(0, VENDORS_SHOWN);
  if (!withFit.length) return null;
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-baseline gap-x-2 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold">Vendors</h2>
        <span className="text-xs text-muted-foreground">each label&apos;s styles pooled · click one to see its styles</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={cn(TH, "text-left")}>Vendor</th>
              <th className={cn(TH, "text-left")}>Lean</th>
              <th className={cn(TH, "text-left")}>Verdict</th>
              <th className={cn(TH, NUM)}>Styles</th>
              <th className={cn(TH, NUM)}>Run small</th>
              <th className={cn(TH, NUM)}>Run large</th>
              <th className={cn(TH, NUM)}>Fit rate</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((v) => {
              const active = view.vendor === v.vendorKey;
              return (
                <tr key={v.vendorKey} className={cn("border-b border-border last:border-0", active && "bg-muted/60")}>
                  <td className={cn(TD, "font-medium")}>
                    <ShallowLink
                      href={fitHref({ ...view, vendor: active ? null : v.vendorKey, verdict: "all", page: 1 })}
                      className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-pressed={active}
                    >
                      {v.vendor}
                    </ShallowLink>
                  </td>
                  <td className={TD}>
                    <LeanBar small={v.small} large={v.large} className="w-40" />
                  </td>
                  <td className={TD}>
                    <VerdictBadge verdict={v.verdict} />
                  </td>
                  <td className={cn(TD, NUM)}>{formatNumber(v.styles)}</td>
                  <td className={cn(TD, NUM, v.stylesSmall > 0 && "text-warning")}>{formatNumber(v.stylesSmall)}</td>
                  <td className={cn(TD, NUM, v.stylesLarge > 0 && "text-info")}>{formatNumber(v.stylesLarge)}</td>
                  <td className={cn(TD, NUM)}>{v.fitRate === null ? "—" : formatPercent(v.fitRate * 100)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {withFit.length > VENDORS_SHOWN && (
        <button
          type="button"
          onClick={() => setAll((open) => !open)}
          className="w-full border-t border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          {all ? "Show fewer vendors" : `Show all ${withFit.length} vendors`}
        </button>
      )}
    </Card>
  );
}

const COLUMNS: { key: FitSortKey | null; label: string; num: boolean }[] = [
  { key: "title", label: "Style", num: false },
  { key: null, label: "Verdict", num: false },
  { key: "lean", label: "Lean", num: false },
  { key: "fitReturns", label: "Fit returns", num: true },
  { key: "fitRate", label: "Fit rate", num: true },
  { key: "sold", label: "Sold", num: true },
  { key: "fitRefund", label: "Refunded", num: true },
];

function StylesCard({ data, view }: { data: FitOverview; view: ViewState }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Start a style page's read when the pointer reaches its row, so the click lands on data.
  const warm = (productId: number) => {
    const def = fitQueries.style(productId);
    void queryClient.prefetchQuery({ queryKey: def.queryKey, queryFn: () => def.load(clientApi) });
  };
  const typing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [q, setQ] = useState(view.q);
  const vendorName = data.vendors.find((v) => v.vendorKey === view.vendor)?.vendor ?? null;

  const scoped = useMemo(
    () => (view.vendor ? data.styles.filter((s) => s.vendorKey === view.vendor) : data.styles),
    [data.styles, view.vendor],
  );
  const rows = useMemo(() => sortStyles(filterStyles(data.styles, view), view.sort, view.dir), [data.styles, view]);
  const page = pageOf(rows, view.page, FIT_PAGE_SIZE);

  const go = (next: ViewState, replace = false) => {
    const href = fitHref(next);
    if (replace) window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
  };

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold">Styles</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(rows.length)} {rows.length === 1 ? "style" : "styles"}
        </span>
        {vendorName && (
          <ShallowLink
            href={fitHref({ ...view, vendor: null, page: 1 })}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {vendorName}
            <X className="size-3" aria-label="Clear vendor" />
          </ShallowLink>
        )}
        <label className="relative ml-auto w-full sm:w-64">
          <span className="sr-only">Search styles</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            placeholder="Search style or vendor…"
            className="h-8 pl-8 text-sm"
            onChange={(event) => {
              const value = event.target.value;
              setQ(value);
              if (typing.current) clearTimeout(typing.current);
              typing.current = setTimeout(() => go({ ...view, q: value, page: 1 }, true), 200);
            }}
          />
        </label>
      </div>
      <div className="scrollbar-none flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2" role="group" aria-label="Verdict">
        {VERDICT_FILTERS.map((filter) => {
          const on = view.verdict === filter;
          return (
            <ShallowLink
              key={filter}
              href={fitHref({ ...view, verdict: filter, page: 1 })}
              aria-pressed={on}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {verdictFilterLabel(filter)}
              <span className="tabular-nums opacity-70">{countFor(scoped, filter)}</span>
            </ShallowLink>
          );
        })}
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-12 text-center text-sm text-muted-foreground">No style matches these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {COLUMNS.map((column) => {
                  const sorted = column.key !== null && view.sort === column.key;
                  return (
                    <th
                      key={column.label}
                      scope="col"
                      aria-sort={sorted ? (view.dir === 1 ? "ascending" : "descending") : undefined}
                      className={cn(TH, column.num ? "text-right" : "text-left")}
                    >
                      {column.key ? (
                        <ShallowLink
                          href={fitHref(sortedBy(view, column.key))}
                          className={cn(
                            "inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            column.num && "flex-row-reverse",
                          )}
                        >
                          {column.label}
                          {sorted && (view.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
                        </ShallowLink>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {page.rows.map((style) => (
                <tr
                  key={style.productId}
                  onClick={() => router.push(fitStyleHref(style.productId))}
                  onMouseEnter={() => warm(style.productId)}
                  onFocus={() => warm(style.productId)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                >
                  <td className={cn(TD, "max-w-[320px]")}>
                    <div className="flex items-center gap-3">
                      <StyleThumb src={style.imageUrl} />
                      <div className="min-w-0">
                        <Link
                          prefetch={false}
                          href={fitStyleHref(style.productId)}
                          onClick={(event) => event.stopPropagation()}
                          className="block truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {style.title}
                        </Link>
                        <span className="block truncate text-xs text-muted-foreground">{style.vendor ?? "No vendor"}</span>
                      </div>
                    </div>
                  </td>
                  <td className={TD}>
                    <div className="flex flex-col items-start gap-0.5">
                      <VerdictBadge verdict={style.verdict} />
                      <ConfidenceText confidence={style.confidence} />
                    </div>
                  </td>
                  <td className={TD}>
                    <LeanBar small={style.small} large={style.large} className="w-36" />
                  </td>
                  <td className={cn(TD, NUM)}>{formatNumber(style.fitReturns)}</td>
                  <td className={cn(TD, NUM)}>{style.fitRate === null ? "—" : formatPercent(style.fitRate * 100)}</td>
                  <td className={cn(TD, NUM)}>{formatNumber(style.sold)}</td>
                  <td className={cn(TD, NUM, "font-semibold")}>{formatCurrency(style.fitRefund)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TablePager
        page={page.page}
        pages={page.pages}
        pageSize={FIT_PAGE_SIZE}
        matches={rows.length}
        noun="styles"
        onPage={(next) => go({ ...view, page: next })}
      />
    </Card>
  );
}
