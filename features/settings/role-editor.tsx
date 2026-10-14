"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  canGrant,
  deleteBlocker,
  draftOf,
  groupState,
  roleDirty,
  toggleGroup,
  togglePermission,
  type PermissionGroup,
  type Role,
  type RoleDraft,
  type TeamAccess,
} from "@/lib/team";
import { cn } from "@/lib/utils";

/** The design-system checkbox (SPEC-324), which can show "some" (indeterminate) — the group
 * checkbox. */
function Check({
  id,
  checked,
  indeterminate = false,
  disabled,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <Checkbox
      id={id}
      className="mt-0.5"
      checked={indeterminate ? "indeterminate" : checked}
      disabled={disabled}
      onCheckedChange={() => onChange()}
      aria-label={label}
    />
  );
}

function PermissionGrid({
  groups,
  selected,
  access,
  readOnly,
  onChange,
}: {
  groups: PermissionGroup[];
  selected: string[];
  access: TeamAccess;
  readOnly: boolean;
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {groups.map((group) => {
        const state = groupState(group, selected);
        const anyGrantable = group.permissions.some((p) => canGrant(access, p.key));
        return (
          <fieldset key={group.key} className="rounded-lg border border-border p-4">
            <legend className="sr-only">{group.title}</legend>
            <div className="mb-3 flex items-center gap-2">
              <Check
                id={`group-${group.key}`}
                checked={state === "all"}
                indeterminate={state === "some"}
                disabled={readOnly || !anyGrantable}
                onChange={() => onChange(toggleGroup(group, selected, access))}
                label={`All of ${group.title}`}
              />
              <label htmlFor={`group-${group.key}`} className="text-sm font-semibold">
                {group.title}
              </label>
            </div>
            <ul className="space-y-3">
              {group.permissions.map((permission) => {
                const grantable = canGrant(access, permission.key);
                const id = `perm-${permission.key}`;
                return (
                  <li key={permission.key} className="flex items-start gap-3">
                    <Check
                      id={id}
                      checked={selected.includes(permission.key)}
                      disabled={readOnly || !grantable}
                      onChange={() => onChange(togglePermission(selected, permission.key))}
                      label={permission.label}
                    />
                    <label htmlFor={id} className={cn("space-y-0.5", !grantable && "opacity-60")}>
                      <span className="block text-sm">{permission.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {permission.description}
                        {!grantable && !readOnly ? " · You don't have this" : ""}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </div>
  );
}

export interface RoleEditorProps {
  /** The role being edited, or null for a new role (seeded by `seed`). */
  role: Role | null;
  seed?: RoleDraft;
  groups: PermissionGroup[];
  access: TeamAccess;
  canManage: boolean;
  onSave: (draft: RoleDraft) => Promise<void>;
  onReset?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onDuplicate?: () => void;
  onCancel?: () => void;
}

/**
 * One role's name, description and permission grid (SPEC-316). Keyed by the role in the
 * parent, so switching roles starts a fresh draft. A permission the editor does not hold is
 * disabled — the backend refuses escalation, the screen never invites it.
 */
export function RoleEditor({
  role,
  seed,
  groups,
  access,
  canManage,
  onSave,
  onReset,
  onDelete,
  onDuplicate,
  onCancel,
}: RoleEditorProps) {
  const [draft, setDraft] = useState<RoleDraft>(
    role ? draftOf(role) : seed ?? { name: "", description: "", permissions: [] },
  );
  const [busy, setBusy] = useState<"save" | "reset" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (role?.isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {role.name} <Badge variant="outline">Built-in</Badge>
          </CardTitle>
          <CardDescription>Everything, always. The owner&apos;s access changes only by transferring ownership.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const readOnly = !canManage;
  const isNew = role === null;
  const dirty = isNew ? draft.name.trim().length > 0 : roleDirty(role, draft);
  const blocker = role ? deleteBlocker(role) : null;

  async function act(kind: "save" | "reset" | "delete", action: () => Promise<void>) {
    setBusy(kind);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The change could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Give the role a name.");
      return;
    }
    void act("save", () => onSave(draft));
  }

  return (
    <Card>
      <form onSubmit={save} noValidate>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isNew ? "New role" : role.name}
              {role?.builtIn ? <Badge variant="outline">Built-in</Badge> : null}
            </CardTitle>
            <CardDescription>
              {isNew
                ? "Pick what this role can see and do."
                : `${role.members} member${role.members === 1 ? "" : "s"} · ${role.permissions.length} permission${
                    role.permissions.length === 1 ? "" : "s"
                  }`}
            </CardDescription>
          </div>
          {!isNew && canManage && onDuplicate ? (
            <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
              Duplicate
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={draft.name}
                maxLength={80}
                disabled={readOnly}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                rows={1}
                value={draft.description}
                maxLength={255}
                disabled={readOnly}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
          </div>

          <PermissionGrid
            groups={groups}
            selected={draft.permissions}
            access={access}
            readOnly={readOnly}
            onChange={(permissions) => setDraft({ ...draft, permissions })}
          />

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {canManage ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {role?.builtIn && onReset ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => void act("reset", onReset)}
                  >
                    {busy === "reset" ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
                    Reset to default
                  </Button>
                ) : null}
                {role && !role.builtIn && onDelete ? (
                  blocker ? (
                    <p className="text-xs text-muted-foreground">{blocker}</p>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      disabled={busy !== null}
                      onClick={() => void act("delete", onDelete)}
                    >
                      {busy === "delete" ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
                      Delete role
                    </Button>
                  )
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {onCancel ? (
                  <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy !== null}>
                    Cancel
                  </Button>
                ) : null}
                <Button type="submit" size="sm" disabled={!dirty || busy !== null}>
                  {busy === "save" ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
                  {isNew ? "Create role" : "Save changes"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Your role can see roles but not change them.
            </p>
          )}
        </CardContent>
      </form>
    </Card>
  );
}
