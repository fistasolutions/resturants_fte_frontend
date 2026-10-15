"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/features/restaurant/parts";
import { PERMISSION_LABELS } from "@/lib/permissions";
import { RESTAURANT_KEY } from "@/lib/queries/restaurant";
import { FRANCHISE_ROLE_PERMISSIONS } from "@/lib/restaurant";
import { createFranchiseRole, inviteToFranchise } from "@/services/restaurant-actions";
import type { Branch, FranchiseRole } from "@/types/restaurant";

/** Invite someone into this franchise only, with one of its roles, optionally for some branches. */
export function InviteDialog({
  franchiseeId,
  roles,
  branches,
  onOpenChange,
}: {
  franchiseeId: number;
  roles: FranchiseRole[];
  branches: Branch[];
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState(roles.find((r) => r.key === "general_manager")?.key ?? roles[0]?.key ?? "");
  const [some, setSome] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await inviteToFranchise(franchiseeId, {
        email: email.trim(),
        roleKey,
        branchIds: some ? [...picked] : null,
      });
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "team", franchiseeId] });
      setSent(result.emailed ? `Invitation sent to ${result.email}.` : `Invitation created for ${result.email}; the email could not be sent, so share the sign-up link from Settings › Team.`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sending the invitation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite to this franchise</DialogTitle>
          <DialogDescription>They will see this franchise&apos;s branches only — or just the ones you pick.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={roleKey} onValueChange={setRoleKey}>
              <SelectTrigger aria-label="Role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={some} onCheckedChange={(v) => setSome(v === true)} />
            Only some branches
          </label>
          {some ? (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {branches.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={picked.has(b.id)}
                    onCheckedChange={(v) =>
                      setPicked((cur) => {
                        const next = new Set(cur);
                        if (v === true) next.add(b.id);
                        else next.delete(b.id);
                        return next;
                      })
                    }
                  />
                  <span className="tabular-nums text-muted-foreground">#{b.code}</span> {b.name}
                </label>
              ))}
            </div>
          ) : null}
          <FormError message={error} />
          {sent ? <p className="text-sm text-success">{sent}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <RoleButton need={["franchise_team.manage"]} type="submit" disabled={busy || !email.trim() || !roleKey || (some && picked.size === 0)}>
              {busy ? "Sending…" : "Send invitation"}
            </RoleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A role of this franchise's own — never more than the creator holds, never a head-office power. */
export function RoleDialog({ franchiseeId, onOpenChange }: { franchiseeId: number; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Set<string>>(new Set(["network.view"]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createFranchiseRole(franchiseeId, { name: name.trim(), description: description.trim(), permissions: [...permissions] });
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "team", franchiseeId] });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creating the role failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New franchise role</DialogTitle>
          <DialogDescription>Only this franchise can give it. You can give only what your own role holds.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="Kitchen lead" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-description">What it is for</Label>
            <Input id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Can</legend>
            {FRANCHISE_ROLE_PERMISSIONS.map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={permissions.has(key)}
                  onCheckedChange={(v) =>
                    setPermissions((cur) => {
                      const next = new Set(cur);
                      if (v === true) next.add(key);
                      else next.delete(key);
                      return next;
                    })
                  }
                />
                {PERMISSION_LABELS[key]}
              </label>
            ))}
          </fieldset>
          <FormError message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <RoleButton need={["franchise_team.manage"]} type="submit" disabled={busy || !name.trim() || permissions.size === 0}>
              {busy ? "Creating…" : "Create role"}
            </RoleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
