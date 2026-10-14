"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { OverdueReview } from "@/features/brief/overdue-review";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { briefQueries } from "@/lib/queries/brief";

/** Review + send sheets, read from the client cache (SPEC-230); the send sub-page
 * reads the same cached answer for its location name. */
export function OverdueReviewView() {
  const result = useApiQuery(briefQueries.overdue());
  if (result.isPending) {
    return (
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Skeleton className="h-4 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (result.isError) {
    const err = result.error;
    const message =
      err instanceof ApiError
        ? `Could not load overdue-order sheets (${err.status}) — try refreshing.`
        : "Could not load overdue-order sheets — check your connection and try again.";
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }
  const sheets = result.data.sheets;

  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/brief" className="hover:text-foreground transition-colors">
          Morning Brief
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">Overdue Orders</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Overdue Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review each location&apos;s overdue-order list and send it — one at a time or all at once.
        </p>
      </div>

      <OverdueReview initialSheets={sheets} />
    </div>
  );
}
