"use client";

import { useState } from "react";
import { Check, Copy, Download, LoaderCircle, ShieldAlert, Trash2 } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingRow, SettingsPanel } from "@/features/settings/settings-panel";
import { useCan } from "@/hooks/use-can";
import {
  confirmationMatches,
  exportHref,
  purgeDateLabel,
  type DeletionScheduled,
} from "@/lib/organization-lifecycle";
import { logout } from "@/services/auth";
import { deleteOrganization } from "@/services/settings-actions";

/**
 * Settings → Organization → Your data (SPEC-332 over backend SPEC-340): the owner takes
 * everything away as a ZIP, or deletes the organization — locked at once, erased after 30 days,
 * restorable by link until then. Rendered for the owner only.
 */
export function YourDataPanel({ organizationName }: { organizationName: string }) {
  const [withFiles, setWithFiles] = useState(false);
  return (
    <SettingsPanel
      title="Your data"
      icon={ShieldAlert}
      tone="danger"
      description="Take everything with you, or close the organization for good."
    >
      <SettingRow
        label="Export everything"
        description="A ZIP of CSV files: every store's data, your members, plan history and chats. Passwords and keys are never included."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="export-files" className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            <Checkbox
              id="export-files"
              checked={withFiles}
              onCheckedChange={(value) => setWithFiles(value === true)}
            />
            Include images, videos and files (a larger download)
          </Label>
          <Button variant="outline" size="sm" asChild>
            <a href={exportHref(withFiles)} download>
              <Download className="size-4" aria-hidden />
              Download ZIP
            </a>
          </Button>
        </div>
      </SettingRow>
      <SettingRow
        label="Delete organization"
        description="Locks it for everyone now and erases it after 30 days. You can restore it until then."
      >
        <DeleteOrganizationDialog organizationName={organizationName} />
      </SettingRow>
    </SettingsPanel>
  );
}

function DeleteOrganizationDialog({ organizationName }: { organizationName: string }) {
  const can = useCan();
  const gate = can("team.manage");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DeletionScheduled | null>(null);
  const ready = confirmationMatches(typed, organizationName);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      setDone(await deleteOrganization(typed));
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open && !done) {
          setTyped("");
          setError(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={!gate.allowed} title={gate.reason ?? undefined}>
          <Trash2 className="size-4" aria-hidden />
          Delete…
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {done ? (
          <DeletionDone scheduled={done} organizationName={organizationName} />
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {organizationName}?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Nobody can sign in from the moment you confirm, and every scheduled job stops.
                    After 30 days every store&apos;s data, every member&apos;s access and every chat
                    is erased for good.
                  </p>
                  <p>
                    Your plan is cancelled. Billing history is kept, anonymised, for accounting.
                    Until the 30 days are up, the restore link (emailed to you and shown next)
                    brings everything back.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-semibold text-foreground">{organizationName}</span> to
                confirm
              </Label>
              <Input
                id="delete-confirm"
                value={typed}
                autoComplete="off"
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && ready && !busy && gate.allowed) void confirm();
                }}
              />
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <RoleButton need="team.manage" variant="destructive" disabled={!ready || busy} onClick={() => void confirm()}>
                {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
                Delete organization
              </RoleButton>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeletionDone({
  scheduled,
  organizationName,
}: {
  scheduled: DeletionScheduled;
  organizationName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(scheduled.restoreUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function signOut() {
    setLeaving(true);
    try {
      await logout();
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{organizationName} is scheduled for deletion</AlertDialogTitle>
        <AlertDialogDescription>
          It is locked now and will be erased on{" "}
          <span className="font-semibold text-foreground">
            {purgeDateLabel(scheduled.purgeAfter)}
          </span>
          .{" "}
          {scheduled.emailed
            ? "The restore link below is also in your inbox."
            : "Keep the restore link below — it could not be emailed."}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-muted-foreground">
          {scheduled.restoreUrl}
        </span>
        <Button variant="outline" size="sm" onClick={() => void copy()} aria-label="Copy the restore link">
          {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <AlertDialogFooter>
        <Button onClick={() => void signOut()} disabled={leaving}>
          {leaving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          Sign out
        </Button>
      </AlertDialogFooter>
    </>
  );
}
