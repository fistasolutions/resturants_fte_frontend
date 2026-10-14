"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText, Search } from "lucide-react";

import ReportHistoryLoading from "@/app/(app)/reports/history/loading";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HistoryFilters } from "@/features/reports/history-filters";
import { useApiQuery } from "@/hooks/use-api-query";
import { REPORT_HISTORY_PAGE_SIZE as HISTORY_PAGE_SIZE } from "@/lib/page-sizes";
import { reportQueries, type ReportHistoryQuery } from "@/lib/queries/reports";
import { scopeHref, scopeLabel } from "@/lib/report-scope";
import { formatDate, formatTime } from "@/utils/format";
import { GlispIcon } from "@/components/shared/glisp-icon";

export function historyHref(
  q: string,
  type: string | null,
  scope: string | null,
  page: number,
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (scope) params.set("scope", scope);
  else if (type) params.set("type", type);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/reports/history?${query}` : "/reports/history";
}

interface ReportHistoryViewProps {
  q: string;
  type: string | null;
  scope: string | null;
  page: number;
}

/** The report archive, read from the client cache (SPEC-230, SPEC-035). */
export function ReportHistoryView({ q, type, scope, page }: ReportHistoryViewProps) {
  const query: ReportHistoryQuery = {
    q: q || null,
    type,
    scope,
    limit: HISTORY_PAGE_SIZE,
    offset: (page - 1) * HISTORY_PAGE_SIZE,
  };
  const history = useApiQuery(reportQueries.history(query));
  const scopes = useApiQuery(reportQueries.scopes());

  if (history.isPending || scopes.isPending) return <ReportHistoryLoading />;
  if (history.isError) {
    return <QueryErrorState error={history.error} onRetry={() => void history.refetch()} />;
  }
  if (scopes.isError) {
    return <QueryErrorState error={scopes.error} onRetry={() => void scopes.refetch()} />;
  }

  const items = history.data.items;
  const total = history.data.total;
  const totalPages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));

  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Report History"
        description="Every stored report — daily briefings and brand/location views. Search by brand or location name."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">Back to reports</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <form
          method="get"
          action="/reports/history"
          role="search"
          className="relative w-full max-w-md"
        >
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search brands or locations…"
            aria-label="Search report history"
            className="pl-9"
          />
          {type && <input type="hidden" name="type" value={type} />}
          {scope && <input type="hidden" name="scope" value={scope} />}
        </form>
        <HistoryFilters scopes={scopes.data} q={q} type={type} scope={scope} />
      </div>

      <Card className="gap-0 p-0">
        {items.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">
            {q
              ? `No reports match “${q}” — try a brand or location name.`
              : "No reports stored yet. Generate one from the Daily Reports page."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={`${item.report_date}-${item.scope}`}>
                <Link
                  href={scopeHref(item.report_date, item.scope)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring md:px-6"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {item.scope === "all"
                        ? "All brands — daily briefing"
                        : scopeLabel(item.scope, scopes.data.locations)}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {formatDate(item.report_date)}
                      </span>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Generated {formatDate(item.updated_at)} · {formatTime(item.updated_at)}
                    </span>
                  </span>
                  {item.generated_by === "ai" ? (
                    <Badge variant="outline" className="shrink-0 gap-1 font-normal">
                      <GlispIcon className="size-3" aria-hidden />
                      AI
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="shrink-0 font-normal text-muted-foreground"
                    >
                      Fallback
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {total > HISTORY_PAGE_SIZE && (
        <nav aria-label="History pages" className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            <Link
              href={historyHref(q, type, scope, page - 1)}
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Previous
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {page} of {totalPages} · {total} reports
          </p>
          <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
            <Link
              href={historyHref(q, type, scope, page + 1)}
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </nav>
      )}
    </main>
  );
}
