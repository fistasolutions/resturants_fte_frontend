"use client";

import { useState } from "react";
import { Check, ExternalLink, LoaderCircle, Unplug } from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-provider";
import { RoleButton } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-error";
import { gorgiasScopeLabels, gorgiasSubdomain } from "@/lib/gorgias-connect";
import { disconnectGorgiasOAuth, startGorgiasConnect } from "@/services/gorgias-connect-actions";

/**
 * Connect with Gorgias (SPEC-372): the subdomain box and the button that starts the round trip,
 * and the "Connected with Gorgias" block with what the sign-in may do and Disconnect. Shared by
 * Gorgias's Settings tab and the hub's connect dialog. Both writes need "Manage integrations",
 * the permission the backend's route enforces.
 */
export function GorgiasConnectForm({
  initialSubdomain,
  label = "Connect with Gorgias",
  note,
}: {
  initialSubdomain?: string | null;
  label?: string;
  /** A line above the box, e.g. why the subdomain is asked for. */
  note?: string | null;
}) {
  const [value, setValue] = useState(initialSubdomain ?? "");
  const [going, setGoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    const check = gorgiasSubdomain(value);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setGoing(true);
    setError(null);
    try {
      // Navigates away on success; the spinner stays until the page changes.
      await startGorgiasConnect(check.subdomain);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not start the Gorgias sign-in. Try again.");
      setGoing(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void start();
      }}
    >
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      <div className="flex max-w-md flex-col gap-1.5">
        <Label htmlFor="gorgias-subdomain">Your Gorgias subdomain</Label>
        <div className="flex items-center gap-2">
          <Input
            id="gorgias-subdomain"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="yourstore"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="gorgias-subdomain-hint"
            aria-invalid={error !== null}
          />
          <span className="shrink-0 text-sm text-muted-foreground">.gorgias.com</span>
        </div>
        <p id="gorgias-subdomain-hint" className="text-xs text-muted-foreground">
          The part before .gorgias.com in your helpdesk address.
        </p>
      </div>
      <div>
        <RoleButton need="integrations.manage" type="submit" disabled={going}>
          {going ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {label}
          <ExternalLink className="size-4" aria-hidden />
        </RoleButton>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}

/** What the granted scopes allow, in words. */
export function GorgiasScopeList({ scopes }: { scopes: readonly string[] }) {
  const lines = gorgiasScopeLabels(scopes);
  if (!lines.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">What it may do in Gorgias</p>
      <ul className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Disconnect the sign-in, confirmed first. A pasted key, if one is saved, stays in force. */
export function GorgiasDisconnectButton({ onDisconnected }: { onDisconnected: () => void }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    const yes = await confirm({
      title: "Disconnect the Gorgias sign-in?",
      body: "We revoke the sign-in at Gorgias and forget it here. An API key saved on this page stays in force; without one, ticket syncing and the Customer Support employee stop until you connect again. What was already synced stays.",
      confirmLabel: "Disconnect",
    });
    if (!yes) return;
    setBusy(true);
    setError(null);
    try {
      await disconnectGorgiasOAuth();
      onDisconnected();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <RoleButton need="integrations.manage" type="button" size="sm" variant="outline" disabled={busy} onClick={() => void disconnect()}>
        {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Unplug className="size-4" aria-hidden />}
        Disconnect
      </RoleButton>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** "Connected with Gorgias" (or "needs reconnecting"), what it may do, and Disconnect. */
export function GorgiasOAuthConnected({
  scopes,
  subdomain,
  needsReconnecting,
  onDisconnected,
}: {
  scopes: readonly string[];
  subdomain: string | null;
  needsReconnecting: boolean;
  onDisconnected: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {needsReconnecting ? (
          <StatusBadge tone="warning">Gorgias needs reconnecting</StatusBadge>
        ) : (
          <StatusBadge tone="success">Connected with Gorgias</StatusBadge>
        )}
        <span className="text-sm text-muted-foreground">
          {subdomain ? `${subdomain}.gorgias.com · ` : ""}Signed in through Gorgias. No key to copy or rotate.
        </span>
      </div>
      {needsReconnecting ? (
        <GorgiasConnectForm
          initialSubdomain={subdomain}
          label="Reconnect with Gorgias"
          note="Gorgias stopped accepting the sign-in, so syncing has paused. Reconnect to pick up where it left off."
        />
      ) : (
        <GorgiasScopeList scopes={scopes} />
      )}
      <GorgiasDisconnectButton onDisconnected={onDisconnected} />
    </div>
  );
}
