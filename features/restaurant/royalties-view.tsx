"use client";

import Link from "next/link";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyPanel, Figure, Num, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { money, share } from "@/lib/restaurant";
import type { RestaurantFilters } from "@/types/restaurant";

/** Royalties (SPEC-377 over backend SPEC-389): what each franchisee owes for the period. */
export function RoyaltiesView({ filters }: { filters: RestaurantFilters }) {
  const query = useApiQuery(restaurantQueries.royalties(filters));
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={4} />;
  const data = query.data;
  if (data.statements.length === 0) {
    return <EmptyPanel title="No franchisees yet" body="Add your franchisees and their rates on Network › Franchisees." />;
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Figure label="Gross sales" value={money(data.totals.netSales)} hint="the royalty basis" />
        <Figure label="Royalty" value={money(data.totals.royalty)} />
        <Figure label="Ad fund" value={money(data.totals.adFund)} />
        <Figure label="Total due" value={money(data.totals.totalDue)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Franchisee</TableHead>
              <TableHead className="hidden text-right md:table-cell">Branches trading</TableHead>
              <TableHead className="text-right">Gross sales</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Royalty rate</TableHead>
              <TableHead className="text-right">Royalty</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Ad fund rate</TableHead>
              <TableHead className="text-right">Ad fund</TableHead>
              <TableHead className="text-right">Total due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.statements.map((s) => (
              <TableRow key={s.franchiseeId}>
                <TableCell>
                  <Link href={`/network/franchisees/${s.franchiseeId}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                    {s.name}
                  </Link>
                  {s.kind === "corporate" ? (
                    <Badge variant="secondary" className="ml-2">
                      Corporate
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="hidden text-right md:table-cell"><Num>{s.branchesTrading}</Num></TableCell>
                <TableCell className="text-right"><Num>{money(s.netSales)}</Num></TableCell>
                <TableCell className="hidden text-right lg:table-cell"><Num>{share(s.royaltyRate)}</Num></TableCell>
                <TableCell className="text-right"><Num>{money(s.royalty)}</Num></TableCell>
                <TableCell className="hidden text-right lg:table-cell"><Num>{share(s.adFundRate)}</Num></TableCell>
                <TableCell className="text-right"><Num>{money(s.adFund)}</Num></TableCell>
                <TableCell className="text-right"><Num className="font-semibold">{money(s.totalDue)}</Num></TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="hidden md:table-cell" />
              <TableCell className="text-right"><Num>{money(data.totals.netSales)}</Num></TableCell>
              <TableCell className="hidden lg:table-cell" />
              <TableCell className="text-right"><Num>{money(data.totals.royalty)}</Num></TableCell>
              <TableCell className="hidden lg:table-cell" />
              <TableCell className="text-right"><Num>{money(data.totals.adFund)}</Num></TableCell>
              <TableCell className="text-right"><Num className="font-semibold">{money(data.totals.totalDue)}</Num></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
        {data.basisRules.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
