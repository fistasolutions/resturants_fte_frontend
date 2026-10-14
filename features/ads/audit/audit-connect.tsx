"use client";

import { useState } from "react";
import { Eye, ListChecks, LoaderCircle, ShieldCheck } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleButton } from "@/components/shared/role-gate";
import { Card } from "@/components/ui/card";
import { AppLogo } from "@/features/integrations/hub/app-logo";
import { ADS_CONNECT_FLAG, selectionChanged, type AdsConnectFrom } from "@/lib/ad-platforms";
import { connectReason } from "@/lib/connect-reasons";
import { cn } from "@/lib/utils";
import type { AdAccountChoice } from "@/types/ad-platforms";
import { chooseAdAccounts, disconnectMetaAds, metaAdsAuthorizeUrl } from "@/services/ad-platforms-actions";

/**
 * Connecting Meta Ads (SPEC-333): what it does and what it never does, then Meta's consent.
 * The sign-in returns through the callback Social Growth already uses; a flag in session
 * storage brings the owner back to the screen that started it, whatever Meta answers.
 *
 * The button is always drawn. When this server has no Meta app yet it is disabled, with one
 * plain sentence saying who has to do what — never a bare "not available".
 */
export function ConnectMetaCard({
  configured,
  from = "audit",
}: {
  configured: boolean;
  from?: AdsConnectFrom;
}) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setOpening(true);
    setError(null);
    try {
      try {
        window.sessionStorage.setItem(ADS_CONNECT_FLAG, from);
      } catch {
        // Storage blocked: the backend still recognises the Ads sign-in by its state.
      }
      window.location.assign(await metaAdsAuthorizeUrl());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach Meta.");
      setOpening(false);
    }
  }

  return (
    <Card className="gap-5 p-6">
      <div className="flex items-start gap-4">
        <AppLogo src="/app-logos/meta.svg" />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold">Connect Meta Ads</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Sign in with Facebook and choose your ad accounts. Paid Ads Manager reads every campaign, ad set and ad
            with 90 days of results, then audits it against fixed rules: money spent without a sale, tired creative,
            costs above your account&rsquo;s norm, ad sets stuck in learning, and missing purchase tracking.
          </p>
        </div>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-3">
        <li className="flex gap-2">
          <Eye className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>Reads campaigns, ads, creatives and results every 3 hours.</span>
        </li>
        <li className="flex gap-2">
          <ListChecks className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>You choose which ad accounts are read.</span>
        </li>
        <li className="flex gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          <span>Read-only: it never changes, pauses or spends on an ad.</span>
        </li>
      </ul>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <RoleButton
          need={["ads.manage", "integrations.manage"]}
          onClick={() => void connect()}
          disabled={!configured || opening}
        >
          {opening && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {opening ? "Opening Meta…" : "Connect Meta Ads"}
        </RoleButton>
        {!configured && (
          <p className="max-w-prose text-sm text-muted-foreground">
            Meta sign-in isn&rsquo;t switched on for this workspace yet. The platform administrator has to add the
            Meta app once; after that this button opens Meta&rsquo;s sign-in.
          </p>
        )}
      </div>
    </Card>
  );
}

const RETURN_NOTICE: Record<string, { text: string; tone: string }> = {
  connected: { text: "Meta Ads connected. Choose the ad accounts to read.", tone: "border-success/30 bg-success/5" },
  cancelled: { text: "Meta sign-in cancelled — nothing was connected.", tone: "border-border bg-muted/40" },
  error: { text: "Meta couldn't be connected. Try again.", tone: "border-destructive/30 bg-destructive/5" },
};

/** The one line after Meta sends the owner back (`?meta=`); nothing for any other value. A
 * refused connect says why (`?reason=`, SPEC-336) — only a code we wrote is shown. */
export function MetaAdsReturnNotice({ value, reason = null }: { value: string | null; reason?: string | null }) {
  const notice = RETURN_NOTICE[value ?? ""];
  if (!notice) return null;
  const refused = value === "error" ? connectReason(reason) : null;
  return (
    <p role="status" className={cn("rounded-xl border px-3 py-2 text-sm", notice.tone)}>
      {refused ? `${refused.title}. ${refused.detail}` : notice.text}
    </p>
  );
}

/** Disconnect Meta Ads, asked first — the same words on the Audit tab and in Integrations. */
export function DisconnectMetaAdsDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => Promise<void> | void;
}) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Meta Ads?</AlertDialogTitle>
          <AlertDialogDescription>
            The sign-in and everything read from your ad accounts are removed from here. Nothing changes in your Meta
            ad account. To remove the app&rsquo;s access at Meta too, remove it in your Business settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
          <RoleButton
            need={["ads.manage", "integrations.manage"]}
            variant="destructive"
            disabled={working}
            onClick={async () => {
              setWorking(true);
              setError(null);
              try {
                await disconnectMetaAds();
                onOpenChange(false);
                await onDone();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Disconnecting failed.");
              }
              setWorking(false);
            }}
          >
            {working ? "Disconnecting…" : "Disconnect"}
          </RoleButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The ad accounts the sign-in can read; only ticked ones are read. */
export function AccountPicker({
  accounts,
  onSaved,
}: {
  accounts: AdAccountChoice[];
  onSaved: () => Promise<void>;
}) {
  const [ticked, setTicked] = useState(() => new Set(accounts.filter((a) => a.selected).map((a) => a.id)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await chooseAdAccounts([...ticked]);
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saving failed.");
    }
    setSaving(false);
  }

  return (
    <Card className="gap-4 p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Choose the ad accounts to audit</h2>
        <p className="text-sm text-muted-foreground">
          Nothing is read from an account you leave unticked. Un-ticking one later removes what was read from it.
        </p>
      </div>
      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This Meta sign-in can&rsquo;t see any ad account. Sign in with a person who has a role on the account.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {accounts.map((account) => (
            <li key={account.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-foreground"
                  checked={ticked.has(account.id)}
                  onChange={(event) => {
                    const next = new Set(ticked);
                    if (event.target.checked) next.add(account.id);
                    else next.delete(account.id);
                    setTicked(next);
                  }}
                />
                <span className="font-medium">{account.name}</span>
                <span className="text-xs text-muted-foreground">
                  {account.id} · {account.currency}
                  {account.active ? "" : " · not active"}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <RoleButton
          need="ads.manage"
          onClick={() => void save()}
          disabled={saving || !selectionChanged(accounts, ticked)}
        >
          {saving ? "Saving…" : "Save and read"}
        </RoleButton>
      </div>
    </Card>
  );
}
