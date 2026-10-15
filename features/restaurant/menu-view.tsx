"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { TableEmptyRow } from "@/components/shared/table-empty-row";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyPanel, Num, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { MENU_CLASSES, menuClassLabel, money, normalizeMenuClass, share, withParams } from "@/lib/restaurant";
import { cn } from "@/lib/utils";
import type { MenuClass, RestaurantFilters } from "@/types/restaurant";

const CLASS_TONE: Record<MenuClass, string> = {
  star: "text-success",
  plowhorse: "text-warning",
  puzzle: "text-primary",
  dog: "text-destructive",
  no_cost: "text-muted-foreground",
};

/** Menu Engineering (SPEC-377 over backend SPEC-389): the four quadrants and every item. */
export function MenuView({ filters }: { filters: RestaurantFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = Object.fromEntries(params.entries());
  const active = normalizeMenuClass(params.get("class"));
  const category = params.get("category");
  const query = useApiQuery(restaurantQueries.menu(filters));
  const rows = useMemo(
    () =>
      (query.data?.items ?? []).filter(
        (item) => (!active || item.class === active) && (!category || item.category === category),
      ),
    [query.data, active, category],
  );
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={5} />;
  const data = query.data;
  if (data.items.length === 0) {
    return <EmptyPanel title="No sales in this period" body="Menu engineering needs items sold and their recipe costs. Send your menu and orders on Network › Data." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {MENU_CLASSES.map((klass) => {
          const selected = active === klass.key;
          return (
            <Link
              key={klass.key}
              href={withParams(pathname, current, { class: selected ? null : klass.key })}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border bg-card px-3 py-2 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-foreground/40" : "border-border",
              )}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{klass.label}</p>
              <p className={cn("text-lg font-bold tabular-nums", CLASS_TONE[klass.key])}>{data.counts[klass.key] ?? 0}</p>
              <p className="truncate text-[11px] text-muted-foreground">{klass.short}</p>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        An item is popular when its share of units reaches {share(data.popularityThreshold)} (70% of an even share); it is
        profitable when its margin reaches {money(data.marginThreshold)}, the average margin weighted by units sold.
      </p>
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="hidden text-right md:table-cell">Mix</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden text-right md:table-cell">Food cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Contribution</TableHead>
                <TableHead>Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyRow span={8} noun="items" onClear={() => router.push(withParams(pathname, current, { class: null, category: null }))} />
              ) : (
                rows.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </TableCell>
                    <TableCell className="text-right"><Num>{item.units}</Num></TableCell>
                    <TableCell className="hidden text-right md:table-cell"><Num>{share(item.mix)}</Num></TableCell>
                    <TableCell className="text-right"><Num>{money(item.price)}</Num></TableCell>
                    <TableCell className="hidden text-right md:table-cell"><Num>{share(item.foodCostPct)}</Num></TableCell>
                    <TableCell className="text-right"><Num>{money(item.margin)}</Num></TableCell>
                    <TableCell className="hidden text-right lg:table-cell"><Num>{money(item.contribution)}</Num></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={CLASS_TONE[item.class]} title={item.action}>
                        {menuClassLabel(item.class)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Panel title="Categories" count={String(data.categories.length)}>
          {data.categories.map((c) => {
            const selected = category === c.category;
            return (
              <Link
                key={c.category}
                href={withParams(pathname, current, { category: selected ? null : c.category })}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50",
                  selected && "bg-muted/60",
                )}
              >
                <span className="truncate font-medium text-foreground">{c.category}</span>
                <span className="text-right text-xs text-muted-foreground tabular-nums">
                  {money(c.revenue)} · {c.units} sold
                </span>
              </Link>
            );
          })}
        </Panel>
      </div>
      {active ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{menuClassLabel(active)}:</span>{" "}
          {data.items.find((i) => i.class === active)?.action ?? ""}
        </p>
      ) : null}
    </div>
  );
}
