"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Coins, PlugZap, Search, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPTY_MONEY_QUERY,
  MONEY_PAGE_FILTERS,
  MONEY_PAGE_SORTS,
  moneyFilterCounts,
  noMatchNote,
  pagerLabel,
  rateNote,
  viewMoneyPages,
  type MoneyPageFilter,
  type MoneyPageQuery,
  type MoneyPageSort,
  type MoneyPagesData,
} from "@/lib/money-pages";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/utils/format";

import { MoneyPageRow } from "./money-page-row";

const SEG =
  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";

function EmptyState({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-muted-foreground" aria-hidden>
          {icon}
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground">{children}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Spotlight › Money pages (SPEC-308, backend SPEC-304).
 *
 * The product and collection pages Google already shows and that already sell, ranked by
 * what a properly written page would be worth — not by impressions, which is the list
 * every SEO tool gives and the wrong one for a shop.
 *
 * Filtering, searching, sorting and paging all run on data already in hand: the whole
 * ranked list arrives in one snapshot read, so narrowing it never costs a request.
 */
export function MoneyPagesView({ data }: { data: MoneyPagesData }) {
  const [query, setQuery] = useState<MoneyPageQuery>(EMPTY_MONEY_QUERY);

  const counts = useMemo(() => moneyFilterCounts(data.pages), [data.pages]);
  const view = useMemo(() => viewMoneyPages(data.pages, query), [data.pages, query]);

  /** Every narrowing change returns to page 1 — a filter that leaves you on page 14 of a
   * 2-page result shows an empty tab and reads as a bug. */
  const narrow = (patch: Partial<MoneyPageQuery>) =>
    setQuery((current) => ({ ...current, ...patch, page: 1 }));

  if (!data.connected) {
    return (
      <EmptyState icon={<PlugZap className="size-8" />} title="Search Console isn't connected">
        Money pages are found by comparing what Google already shows your product and
        collection pages for against what they earn. Connect Search Console in Integrations
        and this fills in on the next read.
      </EmptyState>
    );
  }

  if (data.pages.length === 0) {
    return (
      <EmptyState icon={<Coins className="size-8" />} title="No page is worth rewriting yet">
        A page qualifies once Google has shown it at least 50 times in 28 days, it sits
        between positions 4 and 30, and it has earned something. Pages below that
        haven&apos;t told us enough to be worth your afternoon.
      </EmptyState>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-4">
      <Card className="gap-0">
        <CardContent className="space-y-1 p-4">
          <p className="text-sm font-medium text-foreground">
            {formatNumber(summary.pages)} {summary.pages === 1 ? "page is" : "pages are"} worth
            rewriting
            {summary.valued > 0 && (
              <>
                {" "}
                — about {formatCurrency(summary.value)} a month between the{" "}
                {formatNumber(summary.valued)} we can price
              </>
            )}
            .
          </p>
          <p className="text-xs text-muted-foreground">
            {formatNumber(summary.unwritten)} of them have no search copy at all, so Shopify
            falls back to the page title. Last read{" "}
            {data.windowEnd
              ? new Date(`${data.windowEnd}T00:00:00Z`).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })
              : "—"}
            , over the last 28 days.
          </p>
          <p className="text-xs text-muted-foreground">{rateNote(data)}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filter money pages"
          className="flex flex-wrap gap-1 rounded-lg bg-muted p-0.5"
        >
          {MONEY_PAGE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              aria-pressed={query.filter === filter.key}
              onClick={() => narrow({ filter: filter.key as MoneyPageFilter })}
              className={cn(
                SEG,
                query.filter === filter.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}{" "}
              <span className="ml-1 tabular-nums opacity-70">
                {formatNumber(counts[filter.key])}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-52 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query.search}
            onChange={(event) => narrow({ search: event.target.value })}
            placeholder="Search a page or one of its searches…"
            aria-label="Search money pages"
            className="h-8 pr-8 pl-8 text-sm"
          />
          {query.search && (
            <button
              type="button"
              onClick={() => narrow({ search: "" })}
              aria-label="Clear the search"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Select
          value={query.sort}
          onValueChange={(value) => narrow({ sort: value as MoneyPageSort })}
        >
          <SelectTrigger className="h-8 w-[190px]" aria-label="Sort money pages">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONEY_PAGE_SORTS.map((sort) => (
              <SelectItem key={sort.key} value={sort.key}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {view.total === 0 ? (
        <EmptyState icon={<Search className="size-8" />} title="No page matches that">
          {noMatchNote(query)}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {view.visible.map((page) => (
            <MoneyPageRow key={`${page.kind}-${page.pageId}`} page={page} />
          ))}
        </div>
      )}

      {view.pages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">{pagerLabel(view)}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuery((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
              disabled={view.page <= 1}
              aria-label="Previous page"
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> Prev
            </button>
            <button
              type="button"
              onClick={() => setQuery((c) => ({ ...c, page: Math.min(view.pages, c.page + 1) }))}
              disabled={view.page >= view.pages}
              aria-label="Next page"
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
