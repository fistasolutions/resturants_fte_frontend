"use client";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyPanel, Figure, Num, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { count, money, periodLabel } from "@/lib/restaurant";
import type { RestaurantFilters } from "@/types/restaurant";

/** Guests (SPEC-377 over backend SPEC-389): who orders, who returns, who has gone quiet. */
export function GuestsView({ filters }: { filters: RestaurantFilters }) {
  const query = useApiQuery(restaurantQueries.guests(filters));
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={6} />;
  const data = query.data;
  if (data.knownGuests === 0) {
    return (
      <EmptyPanel
        title="No known guests yet"
        body="A guest is known when an order carries a phone number, an email or the POS's customer id. They appear here as orders arrive."
      />
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Figure label="Active" value={count(data.active)} hint={`ordered ${periodLabel(data.period.from, data.period.to)}`} />
        <Figure label="New" value={count(data.new)} hint="first order ever" />
        <Figure label="Returning" value={count(data.returning)} hint="ordered before" />
        <Figure label="Lapsed" value={count(data.lapsed)} hint="last order 30–90 days ago" />
        <Figure label="Lost" value={count(data.lost)} hint="no order in 90+ days" />
        <Figure label="Orders per guest" value={data.ordersPerGuest == null ? "—" : data.ordersPerGuest.toFixed(2)} hint="this period" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Most valuable guests</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Net sales</TableHead>
              <TableHead className="hidden text-right md:table-cell">Last order</TableHead>
              <TableHead className="hidden md:table-cell">Marketing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.top.map((g) => (
              <TableRow key={g.guestId}>
                <TableCell>
                  <p className="font-medium text-foreground">{g.name ?? "Guest"}</p>
                  <p className="text-xs text-muted-foreground">{[g.phone, g.email].filter(Boolean).join(" · ") || "—"}</p>
                </TableCell>
                <TableCell className="text-right"><Num>{g.orders}</Num></TableCell>
                <TableCell className="text-right"><Num>{money(g.netSales)}</Num></TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  <Num>{g.lastOrder ? periodLabel(g.lastOrder, g.lastOrder) : "—"}</Num>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {g.marketingOptIn ? <Badge variant="secondary">Opted in</Badge> : <span className="text-xs text-muted-foreground">Not opted in</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
