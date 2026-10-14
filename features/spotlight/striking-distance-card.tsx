"use client";

import { Crosshair } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { spotlightQueries } from "@/lib/queries/spotlight";
import { formatDate, formatNumber } from "@/utils/format";

/**
 * Page-two opportunities (SPEC-265; backend SPEC-264): the searches the store
 * already ranks 8–25 for, ranked by the clicks a page-one move would add. Read
 * from the latest local Search Console snapshot — no live Google call. Honest
 * empty state before the first snapshot.
 */
export function StrikingDistanceCard() {
  const query = useApiQuery(spotlightQueries.strikingDistance());

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Crosshair className="size-4 text-primary" aria-hidden />
          Page-two opportunities
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Searches your store already ranks 8–25 for. A focused post on one of these
          moves an existing ranking to page one — the cheapest win in search.
          {query.data?.windowEnd
            ? ` Snapshot ${formatDate(query.data.windowEnd)}, last ${query.data.windowDays} days.`
            : ""}
        </p>
      </CardHeader>
      <CardContent className="px-0">
        {query.isPending ? (
          <div className="space-y-2 px-4" aria-busy="true" aria-label="Loading opportunities">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : query.isError ? (
          <p role="alert" className="px-4 text-sm text-destructive">
            {query.error.message}
          </p>
        ) : query.data.opportunities.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground">
            {query.data.windowEnd
              ? "Nothing in striking distance right now — no search with real impressions sits between positions 8 and 25."
              : "Appears after the next Search Console sync takes its first store-wide snapshot."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Search</TableHead>
                <TableHead className="text-right">Position</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks now</TableHead>
                <TableHead className="text-right">Potential clicks</TableHead>
                <TableHead className="pr-4">Topic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.opportunities.map((row) => (
                <TableRow key={row.query}>
                  <TableCell className="pl-4 whitespace-normal font-medium text-foreground">
                    {row.query}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.position.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.impressions)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(row.clicks)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-foreground">
                    +{formatNumber(Math.round(row.potentialClicks))}
                  </TableCell>
                  <TableCell className="pr-4">
                    {row.cluster ? (
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {row.cluster}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No topic yet</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
