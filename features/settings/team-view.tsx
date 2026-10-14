"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { History, MailPlus, MoreHorizontal, ShieldOff, Users } from "lucide-react";
import Link from "next/link";

import { useConfirm } from "@/components/shared/confirm-provider";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChangeRoleDialog, InviteDialog } from "@/features/settings/member-dialogs";
import { TeamSkeleton } from "@/features/settings/settings-skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { teamQueries } from "@/lib/queries/team";
import {
  can,
  expiresIn,
  grantableRoles,
  seatLine,
  seatsFull,
  seatsFullReason,
  hasAnyAction,
  inviteOutcome,
  memberActions,
  type Invitation,
  type Member,
} from "@/lib/team";
import { cn } from "@/lib/utils";
import {
  inviteMember,
  removeMember,
  revokeInvitation,
  transferOwnership,
  updateMember,
} from "@/services/team";
import { formatDate } from "@/utils/format";

type Notice = { tone: "success" | "error"; text: string } | null;

function message(failure: unknown, fallback: string): string {
  return failure instanceof Error && failure.message ? failure.message : fallback;
}

/** "Your role doesn't include the team" — a 403 on the members read. */
function NoTeamAccess() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <ShieldOff className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">Your role doesn&apos;t include the team</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          An owner or admin can give you access to see who is in the organization.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Settings → Team (SPEC-316): the organization's members with their roles, the pending
 * invitations and Invite (the activity log has its own tab since SPEC-324). Four reads in parallel
 * (prefetched by the page);
 * every write refreshes the `["team"]` cache. A row offers only what the signed-in member may
 * do — the backend enforces the same rules (SPEC-317).
 */
export function TeamView() {
  const members = useApiQuery(teamQueries.members());
  const invitations = useApiQuery(teamQueries.invitations());
  const roles = useApiQuery(teamQueries.roles());
  const access = useApiQuery(teamQueries.access());
  const seats = useApiQuery(teamQueries.seats());
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [inviting, setInviting] = useState(false);
  const [changing, setChanging] = useState<Member | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const ownerKeys = useMemo(
    () => new Set((roles.data ?? []).filter((r) => r.isOwner).map((r) => r.key)),
    [roles.data],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["team"] });

  if (members.error instanceof ApiError && members.error.status === 403) return <NoTeamAccess />;
  const failed = members.error ?? roles.error ?? access.error;
  if (failed) {
    return (
      <QueryErrorState
        error={failed}
        onRetry={() => void Promise.all([members.refetch(), roles.refetch(), access.refetch()])}
      />
    );
  }
  if (!members.data || !roles.data || !access.data || invitations.isPending) {
    return <TeamSkeleton />;
  }
  const people = members.data;

  const me = access.data;
  const manage = can(me, "team.manage");
  const grantable = grantableRoles(roles.data, me);
  const pending = invitations.data ?? [];

  async function run(action: () => Promise<unknown>, success: string, fallback: string) {
    setNotice(null);
    try {
      await action();
      setNotice({ tone: "success", text: success });
    } catch (failure) {
      setNotice({ tone: "error", text: message(failure, fallback) });
    } finally {
      await refresh();
    }
  }

  async function invite(email: string, roleKey: string) {
    const result = await inviteMember(email, roleKey);
    setInviting(false);
    setNotice({ tone: result.emailed ? "success" : "error", text: inviteOutcome(email, result.emailed) });
    await refresh();
  }

  async function changeRole(member: Member, roleKey: string) {
    await updateMember(member.id, { roleKey });
    setChanging(null);
    setNotice({ tone: "success", text: `${member.name}'s role changed.` });
    await refresh();
  }

  async function toggleActive(member: Member) {
    if (member.active) {
      const yes = await confirm({
        title: `Disable ${member.name}?`,
        body: "They are signed out and can't open the organization until you enable them again.",
        confirmLabel: "Disable",
        destructive: true,
      });
      if (!yes) return;
    }
    await run(
      () => updateMember(member.id, { active: !member.active }),
      `${member.name} ${member.active ? "disabled" : "enabled"}.`,
      "The change could not be saved.",
    );
  }

  async function remove(member: Member) {
    const yes = await confirm({
      title: `Remove ${member.name}?`,
      body: "They lose access to this organization. You can invite them again later.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!yes) return;
    await run(() => removeMember(member.id), `${member.name} removed.`, "They could not be removed.");
  }

  async function makeOwner(member: Member) {
    const yes = await confirm({
      title: `Make ${member.name} the owner?`,
      body: "They get full control of the organization, including billing. You become an Admin.",
      confirmLabel: "Transfer ownership",
      destructive: true,
    });
    if (!yes) return;
    await run(
      async () => {
        await transferOwnership(member.userId);
        await queryClient.invalidateQueries();
      },
      `${member.name} is now the owner.`,
      "Ownership could not be transferred.",
    );
  }

  async function revoke(invitation: Invitation) {
    const yes = await confirm({
      title: `Revoke the invitation to ${invitation.email}?`,
      body: "The link in their email stops working.",
      confirmLabel: "Revoke",
      destructive: true,
    });
    if (!yes) return;
    await run(() => revokeInvitation(invitation.id), "Invitation revoked.", "It could not be revoked.");
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" aria-hidden />
              Members
            </CardTitle>
            <CardDescription>{seatLine(seats.data, people.length, pending.length)}</CardDescription>
          </div>
          {manage && grantable.length > 0 ? (
            seatsFull(seats.data) ? (
              <div className="flex flex-col items-end gap-1">
                <Button size="sm" disabled title={seatsFullReason(seats.data)}>
                  <MailPlus aria-hidden />
                  Invite
                </Button>
                <Button asChild size="sm" variant="link" className="h-auto p-0 text-xs">
                  <Link href="/settings/billing">Upgrade for more seats</Link>
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setInviting(true)}>
                <MailPlus aria-hidden />
                Invite
              </Button>
            )
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {notice ? (
            <p
              role="status"
              className={cn("text-sm", notice.tone === "error" ? "text-destructive" : "text-success")}
            >
              {notice.text}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((member) => {
                  const actions = memberActions(member, me, ownerKeys);
                  const isMe = member.userId === me.userId;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {member.name}
                            {isMe ? <span className="ml-2 text-xs text-muted-foreground">You</span> : null}
                          </span>
                          <span className="text-xs text-muted-foreground">{member.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ownerKeys.has(member.roleKey) ? (
                          <Badge variant="outline">Owner</Badge>
                        ) : (
                          member.roleName
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={member.active ? "border-success/30 bg-success/10 text-success" : ""}
                        >
                          {member.active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {formatDate(member.joinedAt)}
                      </TableCell>
                      <TableCell>
                        {hasAnyAction(actions) ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Actions for ${member.name}`}>
                                <MoreHorizontal aria-hidden />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.changeRole ? (
                                <DropdownMenuItem onSelect={() => setChanging(member)}>Change role</DropdownMenuItem>
                              ) : null}
                              {actions.toggleActive ? (
                                <DropdownMenuItem onSelect={() => void toggleActive(member)}>
                                  {member.active ? "Disable" : "Enable"}
                                </DropdownMenuItem>
                              ) : null}
                              {actions.makeOwner ? (
                                <DropdownMenuItem onSelect={() => void makeOwner(member)}>Make owner</DropdownMenuItem>
                              ) : null}
                              {actions.remove ? (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant="destructive" onSelect={() => void remove(member)}>
                                    Remove from organization
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pending.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>Sent, not accepted yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {pending.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{invitation.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {invitation.roleName} · expires {expiresIn(invitation.expiresAt)}
                    </span>
                  </div>
                  {manage ? (
                    <Button variant="outline" size="sm" onClick={() => void revoke(invitation)}>
                      Revoke
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {can(me, "audit.view") ? (
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings/audit">
              <History aria-hidden />
              See who changed what in the audit log
            </Link>
          </Button>
        </div>
      ) : null}

      <InviteDialog open={inviting} onOpenChange={setInviting} roles={grantable} onSubmit={invite} />
      <ChangeRoleDialog
        member={changing}
        onOpenChange={(open) => !open && setChanging(null)}
        roles={grantable}
        onSubmit={changeRole}
      />
    </div>
  );
}
