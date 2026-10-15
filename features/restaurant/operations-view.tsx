"use client";

import Link from "next/link";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyPanel, Figure, Num, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import {
  CHANNEL_LABELS,
  SOURCE_LABELS,
  WEEKDAYS,
  count,
  heat,
  labelOf,
  minutes,
  money,
  share,
  type OperationsTab,
} from "@/lib/restaurant";
import type { MixRow, RestaurantFilters } from "@/types/restaurant";

function Speed({ filters }: { filters: RestaurantFilters }) {
  const query = useApiQuery(restaurantQueries.speed(filters));
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={5} />;
  const data = query.data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Figure label="Delivery, average" value={minutes(data.delivery.avgMinutes)} hint={`${count(data.delivery.orders)} timed deliveries`} />
        <Figure label="Delivery, p90" value={minutes(data.delivery.p90Minutes)} hint="9 in 10 arrive within" />
        <Figure label="On time" value={share(data.delivery.onTimeRate)} hint={`within ${data.onTimeTargetMinutes} min`} />
        <Figure label="Late" value={share(data.delivery.lateRate)} hint="after the time promised" />
        <Figure label="Carryout ready" value={minutes(data.carryout.avgMinutes)} hint={`${count(data.carryout.orders)} carryout orders`} />
      </div>
      {data.branches.length === 0 ? (
        <EmptyPanel title="No branches in view" body="Speed of service needs orders with their times." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Deliveries</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="hidden text-right md:table-cell">p90</TableHead>
                <TableHead className="text-right">On time</TableHead>
                <TableHead className="hidden text-right md:table-cell">Late</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Carryout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.branches.map((row) => (
                <TableRow key={row.branchId}>
                  <TableCell>
                    <Link href={`/network/branches/${row.branchId}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                      <Num className="text-muted-foreground">#{row.code}</Num> {row.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.franchiseeName}</p>
                  </TableCell>
                  <TableCell className="text-right"><Num>{row.delivery.orders}</Num></TableCell>
                  <TableCell className="text-right"><Num>{minutes(row.delivery.avgMinutes)}</Num></TableCell>
                  <TableCell className="hidden text-right md:table-cell"><Num>{minutes(row.delivery.p90Minutes)}</Num></TableCell>
                  <TableCell className="text-right"><Num>{share(row.delivery.onTimeRate)}</Num></TableCell>
                  <TableCell className="hidden text-right md:table-cell"><Num>{share(row.delivery.lateRate)}</Num></TableCell>
                  <TableCell className="hidden text-right lg:table-cell"><Num>{minutes(row.carryout.avgMinutes)}</Num></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Dayparts({ filters }: { filters: RestaurantFilters }) {
  const query = useApiQuery(restaurantQueries.dayparts(filters));
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={5} />;
  const data = query.data;
  const max = Math.max(0, ...data.grid.flat().map((c) => c.netSales));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {data.dayparts.map((part) => (
          <Figure
            key={part.key}
            label={`${part.label} · ${part.hours}`}
            value={money(part.netSales)}
            hint={`${share(part.share)} of sales · ${count(part.transactions)} orders · ${money(part.averageTicket)} avg`}
          />
        ))}
      </div>
      <Panel title="Net sales by weekday and hour" count="local time">
        <div className="overflow-x-auto p-4">
          <table className="border-separate border-spacing-0.5 text-[10px]" aria-label="Net sales by weekday and hour">
            <thead>
              <tr>
                <th />
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} scope="col" className="w-6 font-medium text-muted-foreground tabular-nums">
                    {h % 3 === 0 ? h : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.grid.map((row, day) => (
                <tr key={WEEKDAYS[day]}>
                  <th scope="row" className="pr-2 text-left font-medium text-muted-foreground">
                    {WEEKDAYS[day]}
                  </th>
                  {row.map((cell, hour) => (
                    <td key={hour} className="relative size-6 rounded-sm bg-muted" title={`${WEEKDAYS[day]} ${hour}:00 — ${money(cell.netSales)}, ${cell.transactions} orders`}>
                      <span className="absolute inset-0 rounded-sm bg-chart-1" style={{ opacity: heat(cell.netSales, max) }} aria-hidden />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function MixTable({ title, rows, labels }: { title: string; rows: MixRow[]; labels: Record<string, string> }) {
  return (
    <Panel title={title} count={String(rows.length)}>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No completed orders in this period.</p>
      ) : (
        rows.map((row) => (
          <div key={row.key} className="space-y-1.5 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">{labelOf(labels, row.key)}</span>
              <span className="tabular-nums text-muted-foreground">
                {money(row.netSales)} · {share(row.share)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.round((row.share ?? 0) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {count(row.transactions)} orders · {money(row.averageTicket)} average ticket
            </p>
          </div>
        ))
      )}
    </Panel>
  );
}

function Channels({ filters }: { filters: RestaurantFilters }) {
  const query = useApiQuery(restaurantQueries.channels(filters));
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MixTable title="By channel" rows={query.data.channels} labels={CHANNEL_LABELS} />
      <MixTable title="By order source" rows={query.data.sources} labels={SOURCE_LABELS} />
    </div>
  );
}

/** Operations (SPEC-377 over backend SPEC-389): speed of service, dayparts and channels. */
export function OperationsView({ tab, filters }: { tab: OperationsTab; filters: RestaurantFilters }) {
  if (tab === "dayparts") return <Dayparts filters={filters} />;
  if (tab === "channels") return <Channels filters={filters} />;
  return <Speed filters={filters} />;
}
