"use client";

import { useState } from "react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Figure, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { lastMonth, settlementReading } from "@/lib/loyalty";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { formatCurrency, formatNumber } from "@/utils/format";

/** Loyalty › Settlement (SPEC-383, head office): gift-card money sold and spent per franchise. */
export function SettlementTab() {
  const [[from, to], setRange] = useState<[string, string]>(() => lastMonth(new Date()));
  const valid = from !== "" && to !== "" && from <= to;
  const data = useApiQuery(valid ? restaurantQueries.settlement(from, to) : null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="st-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input id="st-from" type="date" value={from} onChange={(e) => setRange([e.target.value, to])} className="h-9 w-[160px]" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="st-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input id="st-to" type="date" value={to} onChange={(e) => setRange([from, e.target.value])} className="h-9 w-[160px]" />
        </div>
        {!valid ? <p className="text-sm text-destructive">Pick a start on or before the end.</p> : null}
      </div>
      {data.isError ? (
        <QueryErrorState error={data.error} onRetry={() => void data.refetch()} />
      ) : !data.data ? (
        <RestaurantSkeleton tiles={3} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Figure label="Sold" value={formatCurrency(data.data.totals.sold)} hint="loaded onto cards in the period" />
            <Figure label="Spent" value={formatCurrency(data.data.totals.redeemed)} hint="paid with cards, less refunds onto them" />
            <Figure label="Still on cards" value={formatCurrency(data.data.outstanding)} hint="every card, today" />
            <Figure label="Cards" value={formatNumber(data.data.cards)} />
          </div>
          <p className="text-sm text-muted-foreground">
            A franchise that sold more than its guests spent holds money other franchises&apos; guests will spend; one that served
            more than it sold is owed it. Settle the difference however the franchise agreement says.
          </p>
          <Panel title="By franchisee" count={String(data.data.franchisees.length)}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Franchisee</th>
                    <th className="px-2 py-2 text-right font-medium">Sold</th>
                    <th className="px-2 py-2 text-right font-medium">Spent</th>
                    <th className="px-2 py-2 text-right font-medium">Net</th>
                    <th className="px-4 py-2 font-medium">Reading</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.franchisees.map((f) => (
                    <tr key={f.franchiseeId}>
                      <td className="px-4 py-2">{f.name}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(f.sold)}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(f.redeemed)}</td>
                      <td className="px-2 py-2 text-right font-semibold">{formatCurrency(f.net)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{settlementReading(f.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
