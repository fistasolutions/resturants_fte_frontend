"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldOff } from "lucide-react";

import { RolesSkeleton } from "@/features/settings/settings-skeletons";
import { useConfirm } from "@/components/shared/confirm-provider";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoleEditor } from "@/features/settings/role-editor";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { teamQueries } from "@/lib/queries/team";
import { can, type Role, type RoleDraft } from "@/lib/team";
import { cn } from "@/lib/utils";
import { createRole, deleteRole, resetRole, updateRole } from "@/services/team";

/** What the right-hand pane shows: an existing role, or a new one (optionally a copy). */
type Selection = { kind: "role"; key: string } | { kind: "new"; seed?: RoleDraft };

/**
 * Settings → Roles (SPEC-316): the organization's roles and the permission grid. Three reads
 * in parallel (prefetched by the page). Built-in roles can be edited and reset; custom roles
 * created, duplicated, edited and deleted once nobody holds them.
 */
export function RolesView() {
  const roles = useApiQuery(teamQueries.roles());
  const groups = useApiQuery(teamQueries.permissions());
  const access = useApiQuery(teamQueries.access());
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  // Bumped after a reset so the editor remounts on the role's restored values.
  const [version, setVersion] = useState(0);

  if (roles.error instanceof ApiError && roles.error.status === 403) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <ShieldOff className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">Your role doesn&apos;t include roles</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            An owner or admin can give you access to see what each role can do.
          </p>
        </CardContent>
      </Card>
    );
  }
  const failed = roles.error ?? groups.error ?? access.error;
  if (failed) {
    return (
      <QueryErrorState
        error={failed}
        onRetry={() => void Promise.all([roles.refetch(), groups.refetch(), access.refetch()])}
      />
    );
  }
  if (!roles.data || !groups.data || !access.data) return <RolesSkeleton />;
  const permissionGroups = groups.data;
  const me = access.data;
  const list = roles.data;
  const canManage = can(me, "roles.manage");
  const current: Selection =
    selection && (selection.kind === "new" || list.some((r) => r.key === selection.key))
      ? selection
      : { kind: "role", key: list.find((r) => !r.isOwner)?.key ?? list[0]?.key ?? "" };
  const role = current.kind === "role" ? (list.find((r) => r.key === current.key) ?? null) : null;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["team"] });
  }

  async function save(draft: RoleDraft) {
    if (current.kind === "new") {
      const created = await createRole(draft);
      setSelection({ kind: "role", key: created.key });
      setSaved(`${created.name} created.`);
    } else if (role) {
      const updated = await updateRole(role.key, draft);
      setSaved(`${updated.name} saved.`);
    }
    await refresh();
  }

  async function reset(target: Role) {
    const yes = await confirm({
      title: `Reset ${target.name} to its default?`,
      body: "Its name, description and permissions go back to how they were built. Members keep the role.",
      confirmLabel: "Reset",
      destructive: true,
    });
    if (!yes) return;
    await resetRole(target.key);
    setSaved(`${target.name} reset to its default.`);
    await refresh();
    setVersion((v) => v + 1);
  }

  async function remove(target: Role) {
    const yes = await confirm({
      title: `Delete the role ${target.name}?`,
      body: "Nobody holds it. This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!yes) return;
    await deleteRole(target.key);
    setSelection(null);
    setSaved(`${target.name} deleted.`);
    await refresh();
  }

  function choose(next: Selection) {
    setSaved(null);
    setSelection(next);
  }

  const editorKey =
    current.kind === "role" ? `role:${current.key}:${version}` : `new:${current.seed?.name ?? ""}`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr] lg:items-start">
      {/* SPEC-324: on a wide screen the role list stays in view while the permission grid scrolls;
          a list taller than the window scrolls on its own. */}
      <nav
        aria-label="Roles"
        className="space-y-2 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:p-0.5 scrollbar-subtle"
      >
        <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {list.map((r) => {
            const active = current.kind === "role" && current.key === r.key;
            return (
              <li key={r.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => choose({ kind: "role", key: r.key })}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "border-foreground bg-accent text-accent-foreground"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    {r.builtIn ? (
                      <Badge variant="outline" className="hidden lg:inline-flex">
                        Built-in
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.members}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {canManage ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => choose({ kind: "new" })}
            aria-pressed={current.kind === "new"}
          >
            <Plus aria-hidden />
            New role
          </Button>
        ) : null}
      </nav>

      <div className="min-w-0 space-y-3">
        {saved ? (
          <p role="status" className="text-sm text-success">
            {saved}
          </p>
        ) : null}
        <RoleEditor
          key={editorKey}
          role={role}
          seed={current.kind === "new" ? current.seed : undefined}
          groups={permissionGroups}
          access={me}
          canManage={canManage}
          onSave={save}
          onReset={role ? () => reset(role) : undefined}
          onDelete={role ? () => remove(role) : undefined}
          onDuplicate={
            role
              ? () =>
                  choose({
                    kind: "new",
                    seed: {
                      name: `${role.name} copy`,
                      description: role.description,
                      permissions: role.permissions.filter((p) => p !== "*"),
                    },
                  })
              : undefined
          }
          onCancel={current.kind === "new" ? () => choose({ kind: "role", key: list[0]?.key ?? "" }) : undefined}
        />
      </div>
    </div>
  );
}
