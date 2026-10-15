"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Upload } from "lucide-react";

import { DeltaBadge } from "@/components/shared/delta-badge";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { TableEmptyRow } from "@/components/shared/table-empty-row";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchDialog } from "@/features/restaurant/branch-dialog";
import { BranchImportDialog } from "@/features/restaurant/branch-import-dialog";
import { EmptyPanel, Num, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { BRANCH_STATUS_LABELS, minutes, money, share } from "@/lib/restaurant";
import type { RestaurantFilters } from "@/types/restaurant";

/** Network › Branches (SPEC-377): the branch league for the period, and adding branches. */
export function BranchesTab({ filters }: { filters: RestaurantFilters }) {
  const query = useApiQuery(restaurantQueries.league(filters));
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const all = query.data?.branches ?? [];
    if (!needle) return all;
    return all.filter((r) =>
      [r.code, r.name, r.franchiseeName, r.regionName ?? ""].some((v) => v.toLowerCase().includes(needle)),
    );
  }, [query.data, search]);

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <RoleButton need={["network.manage"]} variant="outline" onClick={() => setImporting(true)}>
        <Upload aria-hidden />
        Import branches
      </RoleButton>
      <RoleButton need={["network.manage"]} onClick={() => setAdding(true)}>
        <Plus aria-hidden />
        Add branch
      </RoleButton>
    </div>
  );

  let body: React.ReactNode;
  if (query.isError) body = <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  else if (!query.data) body = <RestaurantSkeleton tiles={0} />;
  else if (query.data.branches.length === 0)
    body = <EmptyPanel title="No branches yet" body="Add a branch, or import every branch at once from a spreadsheet." />;
  else
    body = (
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="hidden md:table-cell">Franchisee</TableHead>
              <TableHead className="text-right">Net sales</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Avg ticket</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Labor</TableHead>
              <TableHead className="hidden text-right md:table-cell">Delivery</TableHead>
              <TableHead className="hidden text-right md:table-cell">On time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmptyRow span={9} noun="branches" onClear={() => setSearch("")} />
            ) : (
              rows.map((row) => (
                <TableRow key={row.branchId}>
                  <TableCell>
                    <Num className={row.quartile === 4 ? "font-semibold text-warning" : "text-muted-foreground"}>{row.rank}</Num>
                  </TableCell>
                  <TableCell>
                    <Link href={`/network/branches/${row.branchId}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                      <Num className="text-muted-foreground">#{row.code}</Num> {row.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {row.regionName ? <span>{row.regionName}</span> : null}
                      {row.status !== "open" ? <Badge variant="outline">{BRANCH_STATUS_LABELS[row.status]}</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{row.franchiseeName}</TableCell>
                  <TableCell className="text-right">
                    <Num className="font-medium">{money(row.netSales)}</Num>
                    <div className="flex justify-end">
                      <DeltaBadge delta={row.change == null ? null : row.change * 100} invertDelta={false} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><Num>{row.transactions}</Num></TableCell>
                  <TableCell className="hidden text-right lg:table-cell"><Num>{money(row.averageTicket)}</Num></TableCell>
                  <TableCell className="hidden text-right lg:table-cell"><Num>{share(row.laborPct)}</Num></TableCell>
                  <TableCell className="hidden text-right md:table-cell"><Num>{minutes(row.avgDeliveryMinutes)}</Num></TableCell>
                  <TableCell className="hidden text-right md:table-cell"><Num>{share(row.onTimeRate)}</Num></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search store number, name, franchisee"
            className="pl-8"
            aria-label="Search branches"
          />
        </div>
        {actions}
      </div>
      {body}
      {adding ? <BranchDialog open={adding} onOpenChange={setAdding} /> : null}
      <BranchImportDialog open={importing} onOpenChange={setImporting} />
    </div>
  );
}
