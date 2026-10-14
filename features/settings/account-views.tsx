"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Laptop, LogOut, MonitorSmartphone, Smartphone, Tablet, UserRound } from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-provider";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
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
import { LogoutDialog } from "@/features/auth/logout-dialog";
import {
  PanelHint,
  ReadOnlyValue,
  SaveStatus,
  SettingRow,
  SettingsPanel,
  type SaveState,
} from "@/features/settings/settings-panel";
import { ProfileSkeleton, SecuritySkeleton } from "@/features/settings/settings-skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { nameProblem, passwordProblem, type DeviceKind, type SessionView } from "@/lib/account-settings";
import { ApiError } from "@/lib/api-error";
import { accountQueries } from "@/lib/queries/account";
import { storeQueries } from "@/lib/queries/store";
import { relative } from "@/lib/watchlist";
import {
  changePassword,
  signOutOtherSessions,
  signOutSession,
  updateMyName,
} from "@/services/settings-actions";

/**
 * Settings → Account (SPEC-324 over backend SPEC-331): your own profile and security. Only you
 * see these, whatever your role.
 */

function message(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────

export function ProfileTab() {
  const user = useApiQuery(storeQueries.currentUser());
  if (user.isPending) return <ProfileSkeleton />;
  if (user.isError) return <QueryErrorState error={user.error} onRetry={() => void user.refetch()} />;
  return <ProfilePanel key={user.data.name} name={user.data.name} email={user.data.email} />;
}

function ProfilePanel({ name: initialName, email }: { name: string; email: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const problem = nameProblem(name);
  const dirty = name.trim() !== savedName;

  async function save() {
    if (problem) {
      setError(problem);
      setState("error");
      return;
    }
    setState("saving");
    setError(null);
    try {
      const updated = await updateMyName(name);
      setSavedName(updated.name);
      setName(updated.name);
      setState("saved");
      await queryClient.invalidateQueries({ queryKey: storeQueries.currentUser().queryKey });
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      router.refresh();
    } catch (failure) {
      setError(message(failure, "Could not save your name."));
      setState("error");
    }
  }

  return (
    <SettingsPanel
      title="Profile"
      icon={UserRound}
      description="Your name as your team sees it in the app, the activity log and emails."
      footer={
        <>
          <PanelHint>Only you can change your own profile.</PanelHint>
          <SaveStatus state={state} error={error} />
          <Button size="sm" onClick={() => void save()} disabled={!dirty || state === "saving"}>
            Save
          </Button>
        </>
      }
    >
      <SettingRow label="Photo" description="Your initials, shown beside your name.">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
        >
          {initials(savedName)}
        </span>
      </SettingRow>
      <SettingRow label="Full name" htmlFor="settings-name">
        <Input
          id="settings-name"
          value={name}
          maxLength={120}
          autoComplete="name"
          onChange={(e) => {
            setName(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && dirty) void save();
          }}
          aria-invalid={state === "error" ? true : undefined}
          className="w-full md:max-w-sm"
        />
      </SettingRow>
      <SettingRow label="Email" description="You sign in with this address.">
        <ReadOnlyValue value={email} />
      </SettingRow>
    </SettingsPanel>
  );
}

// ── Security ─────────────────────────────────────────────────────────────────

export function SecurityTab() {
  const sessions = useApiQuery(accountQueries.sessions());
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  if (sessions.isPending) return <SecuritySkeleton />;
  if (sessions.isError) {
    return <QueryErrorState error={sessions.error} onRetry={() => void sessions.refetch()} />;
  }
  const list = sessions.data;
  const others = list.filter((s) => !s.current);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: accountQueries.sessions().queryKey });
  }

  async function endOne(session: SessionView) {
    const yes = await confirm({
      title: `Sign out ${session.device}?`,
      body: "That device will need to sign in again.",
      confirmLabel: "Sign out",
      destructive: true,
    });
    if (!yes) return;
    try {
      await signOutSession(session.id);
      setNotice({ tone: "success", text: `${session.device} is signed out.` });
    } catch (failure) {
      setNotice({ tone: "error", text: message(failure, "That session could not be signed out.") });
    } finally {
      await refresh();
    }
  }

  async function endOthers() {
    const yes = await confirm({
      title: "Sign out every other device?",
      body: "You stay signed in here. Everywhere else will need to sign in again.",
      confirmLabel: "Sign out others",
      destructive: true,
    });
    if (!yes) return;
    try {
      await signOutOtherSessions();
      setNotice({ tone: "success", text: "Every other device is signed out." });
    } catch (failure) {
      setNotice({ tone: "error", text: message(failure, "The other sessions could not be signed out.") });
    } finally {
      await refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {notice ? (
        <p role="status" className={notice.tone === "error" ? "text-sm text-destructive" : "text-sm text-success"}>
          {notice.text}
        </p>
      ) : null}

      <SettingsPanel title="Password" icon={KeyRound} description="Changing it signs you out of every other device.">
        <SettingRow label="Password" description="Use at least 8 characters.">
          <Button variant="outline" onClick={() => setPasswordOpen(true)}>
            Change password
          </Button>
        </SettingRow>
      </SettingsPanel>

      <SettingsPanel
        title="Where you're signed in"
        icon={MonitorSmartphone}
        description="Devices with an active session. Sign out any you don't recognise."
        action={
          others.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => void endOthers()}>
              Sign out all others
            </Button>
          ) : null
        }
      >
        {list.length > 0 ? (
          <ul>
            {list.map((session) => (
              <SessionRow key={session.id} session={session} onSignOut={() => void endOne(session)} />
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">No other active sessions.</p>
        )}
      </SettingsPanel>

      <SettingsPanel title="Sign out" icon={LogOut} description="End your session on this device. Your data stays synced.">
        <SettingRow label="This device">
          <LogoutDialog
            trigger={
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="size-4" aria-hidden />
                Sign out
              </Button>
            }
          />
        </SettingRow>
      </SettingsPanel>

      <PasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onChanged={async () => {
          setPasswordOpen(false);
          setNotice({ tone: "success", text: "Password changed. Every other device is signed out." });
          await refresh();
        }}
      />
    </div>
  );
}

const DEVICE_ICON: Record<DeviceKind, typeof Laptop> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

function SessionRow({ session, onSignOut }: { session: SessionView; onSignOut: () => void }) {
  const Icon = DEVICE_ICON[session.kind];
  return (
    <li className="flex items-center gap-4 border-t border-border px-5 py-4 first:border-t-0 sm:px-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {session.device}
          {session.current ? (
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
              This device
            </Badge>
          ) : null}
        </p>
        <p className="text-sm text-muted-foreground">
          Active {relative(session.lastActiveAt)} · signed in {relative(session.signedInAt)}
        </p>
      </div>
      {session.current ? null : (
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          Sign out
        </Button>
      )}
    </li>
  );
}

function PasswordDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirmValue("");
    setError(null);
    setBusy(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = passwordProblem(next, confirmValue);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await changePassword(current || null, next);
      reset();
      await onChanged();
    } catch (failure) {
      setBusy(false);
      setError(
        failure instanceof ApiError && failure.code === "current_password_incorrect"
          ? "Your current password is not right."
          : message(failure, "Your password could not be changed."),
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) reset();
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>You stay signed in here. Every other device is signed out.</DialogDescription>
        </DialogHeader>
        <form id="password-form" onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="password-current">Current password</Label>
            <Input
              id="password-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Leave empty if you signed up with Google or Shopify.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-new">New password</Label>
            <Input
              id="password-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-confirm">Confirm new password</Label>
            <Input
              id="password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="password-form" disabled={busy || !next}>
            {busy ? "Changing…" : "Change password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
