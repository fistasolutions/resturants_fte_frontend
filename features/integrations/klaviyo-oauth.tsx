"use client";

import { useState, type ComponentProps } from "react";
import { Check, CircleAlert, ExternalLink, LoaderCircle, Unplug } from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-provider";
import { RoleButton } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { klaviyoScopeLabels, type KlaviyoNotice, type KlaviyoReturnPath } from "@/lib/klaviyo-connect";
import { cn } from "@/lib/utils";
import { disconnectKlaviyoOAuth, startKlaviyoConnect } from "@/services/klaviyo-connect-actions";

type ButtonProps = ComponentProps<typeof Button>;

/**
 * Connect with Klaviyo (SPEC-371): the button that starts the round trip, and the
 * "Connected with Klaviyo" block with what the sign-in may do and Disconnect. Shared by the
 * Integrations Klaviyo page, its connect dialog and Email Marketing → Settings → Connection.
 * Both writes need "Manage integrations", the permission the backend's route enforces.
 */
export function KlaviyoConnectButton({
  returnPath,
  label = "Connect with Klaviyo",
  size,
  variant,
  className,
}: {
  returnPath: KlaviyoReturnPath;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [going, setGoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setGoing(true);
    setError(null);
    try {
      // Navigates away on success; the spinner stays until the page changes.
      await startKlaviyoConnect(returnPath);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not start the Klaviyo sign-in. Try again.");
      setGoing(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <RoleButton need="integrations.manage" type="button" size={size} variant={variant} disabled={going} onClick={() => void start()}>
        {going ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        {label}
        <ExternalLink className="size-4" aria-hidden />
      </RoleButton>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** What the granted scopes allow, in words. */
export function KlaviyoScopeList({ scopes }: { scopes: readonly string[] }) {
  const lines = klaviyoScopeLabels(scopes);
  if (!lines.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">What it may do in Klaviyo</p>
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
export function KlaviyoDisconnectButton({
  onDisconnected,
  size = "sm",
}: {
  onDisconnected: () => void;
  size?: ButtonProps["size"];
}) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    const yes = await confirm({
      title: "Disconnect the Klaviyo sign-in?",
      body: "We revoke the sign-in at Klaviyo and forget it here. A private key saved on the Integrations page stays in force; without one, the employee stops reading and writing Klaviyo. Flows already live in Klaviyo keep running there.",
      confirmLabel: "Disconnect",
    });
    if (!yes) return;
    setBusy(true);
    setError(null);
    try {
      await disconnectKlaviyoOAuth();
      onDisconnected();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <RoleButton need="integrations.manage" type="button" size={size} variant="outline" disabled={busy} onClick={() => void disconnect()}>
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

/** "Connected with Klaviyo", what it may do, and Disconnect. */
export function KlaviyoOAuthConnected({
  scopes,
  onDisconnected,
}: {
  scopes: readonly string[];
  onDisconnected: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge tone="success">Connected with Klaviyo</StatusBadge>
        <span className="text-sm text-muted-foreground">Signed in through Klaviyo. No key to copy or rotate.</span>
      </div>
      <KlaviyoScopeList scopes={scopes} />
      <KlaviyoDisconnectButton onDisconnected={onDisconnected} />
    </div>
  );
}

/** The line shown after the round trip through Klaviyo. */
export function KlaviyoNoticeLine({ notice }: { notice: KlaviyoNotice | null }) {
  if (!notice) return null;
  const error = notice.tone === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl border px-4 py-2.5 text-sm",
        error ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5",
      )}
    >
      {error ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      ) : (
        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
      )}
      <span>{notice.text}</span>
    </p>
  );
}
