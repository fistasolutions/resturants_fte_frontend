"use client";

import { useState } from "react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RestaurantSkeleton } from "@/features/restaurant/parts";
import { ScopeDialog } from "@/features/restaurant/scope-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { scopeLabel } from "@/lib/restaurant";
import type { NetworkMember } from "@/types/restaurant";

/** Network › Access (SPEC-377, head office): who sees which part of the network. Invitations and
 * roles live on Settings › Team; a franchise invites its own people from its franchisee page. */
export function AccessTab() {
  const query = useApiQuery(restaurantQueries.members());
  const [editing, setEditing] = useState<NetworkMember | null>(null);
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        A member&apos;s role says what they can do; their access says where. Head office sees every branch; a
        franchise member sees only their franchisee&apos;s branches, or some of them.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sees</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map((m) => (
              <TableRow key={m.membershipId}>
                <TableCell>
                  <p className="font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{m.roleName}</TableCell>
                <TableCell>{scopeLabel(m.franchiseeName, m.branchIds)}</TableCell>
                <TableCell className="text-right">
                  {m.isOwner ? null : (
                    <RoleGate need={["network.manage"]}>
                      <Button size="sm" variant="outline" onClick={() => setEditing(m)}>
                        Change
                      </Button>
                    </RoleGate>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editing ? <ScopeDialog member={editing} onOpenChange={(open) => !open && setEditing(null)} /> : null}
    </div>
  );
}
