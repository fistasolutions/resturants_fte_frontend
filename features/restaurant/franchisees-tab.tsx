"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FranchiseeDialog } from "@/features/restaurant/franchisee-dialog";
import { EmptyPanel, Num, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { share } from "@/lib/restaurant";

/** Network › Franchisees (SPEC-377): the companies that run the branches. */
export function FranchiseesTab() {
  const query = useApiQuery(restaurantQueries.franchisees());
  const [adding, setAdding] = useState(false);
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RoleButton need={["network.manage"]} onClick={() => setAdding(true)}>
          <Plus aria-hidden />
          Add franchisee
        </RoleButton>
      </div>
      {query.data.length === 0 ? (
        <EmptyPanel title="No franchisees yet" body="Add each company that runs branches under your brand." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Franchisee</TableHead>
                <TableHead className="text-right">Branches</TableHead>
                <TableHead className="text-right">Royalty</TableHead>
                <TableHead className="text-right">Ad fund</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link href={`/network/franchisees/${f.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                      {f.name}
                    </Link>
                    <div className="mt-0.5 flex gap-1.5">
                      {f.kind === "corporate" ? <Badge variant="secondary">Corporate</Badge> : null}
                      {f.status !== "active" ? <Badge variant="outline">{f.status === "onboarding" ? "Onboarding" : "Terminated"}</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Num>
                      {f.openBranches} <span className="text-muted-foreground">of {f.branches} open</span>
                    </Num>
                  </TableCell>
                  <TableCell className="text-right"><Num>{f.kind === "corporate" ? "—" : share(f.royaltyRate)}</Num></TableCell>
                  <TableCell className="text-right"><Num>{f.kind === "corporate" ? "—" : share(f.adFundRate)}</Num></TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {[f.contactName, f.contactEmail].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {adding ? <FranchiseeDialog open={adding} onOpenChange={setAdding} /> : null}
    </div>
  );
}
