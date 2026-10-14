"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { briefQueries } from "@/lib/queries/brief";
import { storeTimeZone } from "@/utils/format";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: storeTimeZone(), // store time — SPEC-129/319
    timeZoneName: "short",
  });
}

/** The stored morning briefs (SPEC-230), read from the client cache. */
export function BriefHistoryView({ page }: { page: number }) {
  const result = useApiQuery(briefQueries.history(page, 10));
  if (result.isPending) {
    return (
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  if (result.isError) {
    return <QueryErrorState error={result.error} onRetry={() => void result.refetch()} />;
  }
  const history = result.data;

  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/brief"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to brief
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Brief History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every stored morning brief — click any day to review it.
        </p>
      </div>

      {/* List */}
      {history.items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Clock className="mx-auto size-8 text-muted-foreground mb-3" aria-hidden />
          <p className="text-sm text-muted-foreground">No history yet — briefs appear here after the first day.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {history.items.map((item) => (
            <Link
              key={item.snapshot_date}
              href={`/brief?date=${item.snapshot_date}`}
              className="flex items-center justify-between gap-4 px-5 py-4 bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-semibold">{formatDate(item.snapshot_date)}</p>
                <p className="text-xs text-muted-foreground">
                  Generated {formatTime(item.generated_at)}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-medium">{item.decision_count} decision{item.decision_count !== 1 ? "s" : ""}</p>
                  {item.decisions_approved > 0 && (
                    <p className="text-xs text-success flex items-center gap-1 justify-end">
                      <CheckCircle2 className="size-3" aria-hidden />
                      {item.decisions_approved} approved
                    </p>
                  )}
                </div>
                <ArrowLeft className="size-4 text-muted-foreground rotate-180" aria-hidden />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {history.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {page > 1 ? (
            <Link href={`/brief/history?page=${page - 1}`} className="hover:text-foreground transition-colors">
              ← Previous
            </Link>
          ) : <span />}
          <span>Page {history.page} of {history.pages} · {history.total} briefs</span>
          {page < history.pages ? (
            <Link href={`/brief/history?page=${page + 1}`} className="hover:text-foreground transition-colors">
              Next →
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}
