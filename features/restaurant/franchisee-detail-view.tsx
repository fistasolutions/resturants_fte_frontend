"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Trash2, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Panel, PanelRow } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCan } from "@/hooks/use-can";
import { FranchiseeDialog } from "@/features/restaurant/franchisee-dialog";
import { Figure, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { InviteDialog, RoleDialog } from "@/features/restaurant/team-dialogs";
import { PaymentsPanel } from "@/features/restaurant-os/payments-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { BRANCH_STATUS_LABELS, periodLabel, share } from "@/lib/restaurant";
import { deleteFranchiseRole } from "@/services/restaurant-actions";
import type { Branch } from "@/types/restaurant";

function scopeOf(branchIds: number[] | null, branches: Branch[]): string {
  if (branchIds == null) return "All branches";
  const codes = branches.filter((b) => branchIds.includes(b.id)).map((b) => `#${b.code}`);
  return codes.length ? codes.join(", ") : `${branchIds.length} branches`;
}

function Team({ franchiseeId, branches }: { franchiseeId: number; branches: Branch[] }) {
  const queryClient = useQueryClient();
  const can = useCan();
  const team = useApiQuery(can(["franchise_team.manage"]).allowed || can(["network.manage"]).allowed ? restaurantQueries.team(franchiseeId) : null);
  const [inviting, setInviting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!can(["franchise_team.manage"]).allowed && !can(["network.manage"]).allowed) return null;
  if (team.isError) return <QueryErrorState error={team.error} onRetry={() => void team.refetch()} />;
  if (!team.data) return <RestaurantSkeleton tiles={0} />;
  const data = team.data;

  const remove = async (roleId: number) => {
    setError(null);
    try {
      await deleteFranchiseRole(franchiseeId, roleId);
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "team", franchiseeId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deleting the role failed.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        title="Team"
        count={String(data.members.length)}
        aside={
          <RoleButton need={["franchise_team.manage"]} size="sm" onClick={() => setInviting(true)}>
            <UserPlus aria-hidden />
            Invite
          </RoleButton>
        }
      >
        {data.members.length === 0 && data.invitations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No one in this franchise yet. Invite its owner and managers.</p>
        ) : null}
        {data.members.map((m) => (
          <PanelRow key={m.membershipId} align="center" trailing={<Badge variant="outline">{m.roleName}</Badge>}>
            <p className="text-sm font-medium text-foreground">{m.name}</p>
            <p className="text-xs text-muted-foreground">
              {m.email} · {scopeOf(m.branchIds, branches)}
            </p>
          </PanelRow>
        ))}
        {data.invitations.map((i) => (
          <PanelRow key={`inv-${i.id}`} align="center" trailing={<Badge variant="secondary">Invited</Badge>}>
            <p className="text-sm font-medium text-foreground">{i.email}</p>
            <p className="text-xs text-muted-foreground">
              {i.roleName} · {scopeOf(i.branchIds, branches)} · until {periodLabel(i.expiresAt.slice(0, 10), i.expiresAt.slice(0, 10))}
            </p>
          </PanelRow>
        ))}
      </Panel>
      <Panel
        title="Roles"
        count={String(data.roles.length)}
        aside={
          <RoleButton need={["franchise_team.manage"]} size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            New role
          </RoleButton>
        }
      >
        {data.roles.map((r) => (
          <PanelRow
            key={r.id}
            align="center"
            trailing={
              r.own ? (
                <RoleGate need={["franchise_team.manage"]}>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${r.name}`} onClick={() => void remove(r.id)}>
                    <Trash2 aria-hidden />
                  </Button>
                </RoleGate>
              ) : (
                <Badge variant="secondary">Brand role</Badge>
              )
            }
          >
            <p className="text-sm font-medium text-foreground">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.description || r.permissions.join(", ")}</p>
          </PanelRow>
        ))}
        <div className="px-4 py-2">
          <FormError message={error} />
        </div>
      </Panel>
      {inviting ? <InviteDialog franchiseeId={franchiseeId} roles={data.roles} branches={branches} onOpenChange={setInviting} /> : null}
      {creating ? <RoleDialog franchiseeId={franchiseeId} onOpenChange={setCreating} /> : null}
    </div>
  );
}

/** `/network/franchisees/[id]` (SPEC-377): the franchisee, its branches, and its own team. */
export function FranchiseeDetailView({ franchiseeId }: { franchiseeId: number }) {
  const franchisee = useApiQuery(restaurantQueries.franchisee(franchiseeId));
  const branches = useApiQuery(restaurantQueries.branches({ franchiseeId }));
  const [editing, setEditing] = useState(false);
  const back = (
    <Link href="/network?tab=franchisees" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden />
      Franchisees
    </Link>
  );
  if (franchisee.isError) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        {back}
        <QueryErrorState error={franchisee.error} onRetry={() => void franchisee.refetch()} />
      </main>
    );
  }
  const f = franchisee.data;
  const list = branches.data ?? [];
  return (
    <main className="space-y-4 p-4 md:p-6">
      {back}
      <PageHeader
        title={f?.name ?? "Franchisee"}
        description={f ? (f.kind === "corporate" ? "The brand's own branches" : "A franchise of the brand") : "Loading…"}
        actions={
          f ? (
            <RoleButton need={["network.manage"]} variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden />
              Edit
            </RoleButton>
          ) : null
        }
      />
      {!f ? (
        <RestaurantSkeleton tiles={4} />
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Figure label="Branches" value={`${f.openBranches} of ${f.branches}`} hint="open" />
          <Figure label="Royalty" value={f.kind === "corporate" ? "—" : share(f.royaltyRate)} hint="of net sales" />
          <Figure label="Ad fund" value={f.kind === "corporate" ? "—" : share(f.adFundRate)} hint="of net sales" />
          <Figure
            label="Agreement"
            value={f.agreementEnd ? `to ${periodLabel(f.agreementEnd, f.agreementEnd)}` : "—"}
            hint={f.contactName ?? f.contactEmail ?? undefined}
          />
        </div>
      )}
      <Panel title="Branches" count={String(list.length)}>
        {list.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No branches yet.</p>
        ) : (
          list.map((b) => (
            <PanelRow
              key={b.id}
              href={`/network/branches/${b.id}`}
              align="center"
              trailing={b.status !== "open" ? <Badge variant="outline">{BRANCH_STATUS_LABELS[b.status]}</Badge> : null}
            >
              <p className="text-sm font-medium text-foreground">
                <span className="tabular-nums text-muted-foreground">#{b.code}</span> {b.name}
              </p>
              <p className="text-xs text-muted-foreground">{[b.city, b.regionName].filter(Boolean).join(" · ") || "—"}</p>
            </PanelRow>
          ))
        )}
      </Panel>
      <PaymentsPanel franchiseeId={franchiseeId} />
      <Team franchiseeId={franchiseeId} branches={list} />
      {editing && f ? <FranchiseeDialog open={editing} onOpenChange={setEditing} franchisee={f} /> : null}
    </main>
  );
}
