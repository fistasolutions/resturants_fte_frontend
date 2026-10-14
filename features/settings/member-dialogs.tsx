"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Member, Role } from "@/lib/team";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RoleSelect({
  id,
  roles,
  value,
  onChange,
}: {
  id: string;
  roles: Role[];
  value: string;
  onChange: (key: string) => void;
}) {
  const chosen = roles.find((r) => r.key === value);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Role</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Choose a role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.key} value={role.key}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {chosen?.description ? (
        <p className="text-xs text-muted-foreground">{chosen.description}</p>
      ) : null}
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

/**
 * Invite someone (SPEC-316): an email and one of the roles the inviter may grant. The form
 * mounts with the dialog, so every open starts clean. `onSubmit` rejects with the message to
 * show (the backend's own words).
 */
export function InviteDialog({
  open,
  onOpenChange,
  roles,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onSubmit: (email: string, roleKey: string) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? <InviteForm roles={roles} onSubmit={onSubmit} onCancel={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({
  roles,
  onSubmit,
  onCancel,
}: {
  roles: Role[];
  onSubmit: (email: string, roleKey: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState(
    roles.find((r) => r.key === "viewer")?.key ?? roles[0]?.key ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!roleKey) {
      setError("Choose a role.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(email.trim(), roleKey);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The invitation could not be created.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>Invite someone</DialogTitle>
        <DialogDescription>
          They get an email with a link to join. The invitation lasts a week.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error !== null && !EMAIL.test(email.trim())}
          autoFocus
        />
      </div>
      <RoleSelect id="invite-role" roles={roles} value={roleKey} onChange={setRoleKey} />
      <FormError message={error} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {busy ? "Sending…" : "Send invitation"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Change a member's role to one the manager may grant. */
export function ChangeRoleDialog({
  member,
  onOpenChange,
  roles,
  onSubmit,
}: {
  member: Member | null;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onSubmit: (member: Member, roleKey: string) => Promise<void>;
}) {
  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {member ? (
          <ChangeRoleForm
            member={member}
            roles={roles}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleForm({
  member,
  roles,
  onSubmit,
  onCancel,
}: {
  member: Member;
  roles: Role[];
  onSubmit: (member: Member, roleKey: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [roleKey, setRoleKey] = useState(member.roleKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(member, roleKey);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The role could not be changed.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Change {member.name}&apos;s role</DialogTitle>
        <DialogDescription>
          Currently {member.roleName}. The change applies on their next page load.
        </DialogDescription>
      </DialogHeader>
      <RoleSelect id="member-role" roles={roles} value={roleKey} onChange={setRoleKey} />
      <FormError message={error} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || roleKey === member.roleKey}>
          {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          Save role
        </Button>
      </DialogFooter>
    </form>
  );
}
