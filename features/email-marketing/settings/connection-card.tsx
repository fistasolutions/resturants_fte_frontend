"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, CircleDashed, KeyRound, RefreshCw, Unplug } from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-provider";
import { RoleButton } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { FieldInput } from "@/features/integrations/hub/field-input";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import {
  KlaviyoConnectButton,
  KlaviyoDisconnectButton,
  KlaviyoNoticeLine,
  KlaviyoScopeList,
} from "@/features/integrations/klaviyo-oauth";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { accessBanner } from "@/lib/email-access";
import { snapshotAge } from "@/lib/email-marketing";
import { EMAIL_PROVIDER_ORDER, EMAIL_PROVIDERS, privateKeyProblem, providerInfo } from "@/lib/email-providers";
import { canConnectWithKlaviyo, KLAVIYO_EMAIL_RETURN, klaviyoNotice } from "@/lib/klaviyo-connect";
import { EMAIL_MARKETING_KEY } from "@/lib/queries/email-marketing";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";
import { connectProvider, disconnectProvider, syncNow } from "@/services/email-marketing-actions";
import type { EmailProviderKey, EmailWorkspace } from "@/types/email-marketing";
import { formatTime } from "@/utils/format";

/**
 * The connection (SPEC-345): pick the platform — Klaviyo now, the rest named as coming — and
 * paste a private key in the integration secret-input pattern (SPEC-080/302): a password box,
 * never prefilled, never echoed, cleared after submit. In the preview the key is checked for
 * shape and dropped; nothing is stored or sent.
 *
 * Connect with Klaviyo (SPEC-371) comes first when the platform has the Klaviyo app set up:
 * one click, Allow on Klaviyo's screen, back here connected. The key form then sits under
 * "Use a private API key instead" — open, as before, when a key is already saved.
 */
export function ConnectionCard({ workspace }: { workspace: EmailWorkspace }) {
  const confirm = useConfirm();
  const actions = useEmailMarketingActions();
  const [chosen, setChosen] = useState<EmailProviderKey>(workspace.connection.provider);
  const [key, setKey] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const c = workspace.connection;
  const provider = providerInfo(chosen);
  const connected = c.status === "connected";
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const can = useCan();
  // The sign-in's facts ride on the Integrations overview (backend SPEC-379). A role that
  // cannot see integrations gets no button and the key form, as before.
  const overview = useApiQuery(integrationQueries.overview(), { enabled: can("integrations.view").allowed });
  const oauth = overview.data?.integrations.find((i) => i.key === "klaviyo")?.oauth;
  const klaviyoChosen = chosen === "klaviyo";
  const offerSignIn = klaviyoChosen && canConnectWithKlaviyo(oauth);
  const oauthConnected = klaviyoChosen && oauth?.connected === true;
  const [keyOpen, setKeyOpen] = useState(c.keyOnFile);
  const notice = klaviyoNotice(new URLSearchParams(params.toString()));
  // What the strip under the header showed until SPEC-375 removed it: what the key may not do,
  // and how old the nightly report snapshot is.
  const banner = connected ? accessBanner(workspace.access) : null;
  const age = workspace.snapshotAt ? snapshotAge(workspace.snapshotAt) : null;

  function afterOAuthDisconnect() {
    void queryClient.invalidateQueries({ queryKey: EMAIL_MARKETING_KEY });
    void queryClient.invalidateQueries({ queryKey: integrationQueries.overview().queryKey });
  }

  async function connect() {
    const issue = privateKeyProblem(chosen, key);
    setProblem(issue);
    if (issue) return;
    const value = key.trim();
    setKey("");
    setNote(null);
    const done = await actions.run("connect", () => connectProvider(value));
    if (done) setNote(`Connected. The key is stored encrypted and never shown again; campaigns, flows, lists and profiles are being read from ${provider.name}.`);
  }

  async function connectSaved(how: "key" | "sign-in" = "key") {
    setNote(null);
    const done = await actions.run("connect", () => connectProvider(null));
    const through = how === "key" ? "the saved key" : "the Klaviyo sign-in";
    if (done) setNote(`Connected with ${through}; campaigns, flows, lists and profiles are being read from ${provider.name}.`);
  }

  async function syncNowClicked() {
    setNote(null);
    const done = await actions.run("sync", () => syncNow());
    if (done) setNote(`Read campaigns, flows, lists and profiles from ${providerInfo(c.provider).name}.`);
  }

  async function disconnect() {
    const yes = await confirm({ title: `Disconnect ${providerInfo(c.provider).name}?`, body: "The employee stops reading and writing your email platform. Flows already live there keep running in it — disconnecting does not switch them off.", confirmLabel: "Disconnect" });
    if (yes) await actions.run("disconnect", () => disconnectProvider());
  }

  const keyForm = (
    <>
      {c.keyOnFile ? (
        <div className="space-y-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
          <p>A {provider.name} key is already saved on the Integrations page.</p>
          <RoleButton need={["email_marketing.manage", "integrations.manage"]} size="sm" disabled={actions.busy !== null} onClick={() => void connectSaved()}>
            Connect with the saved key
          </RoleButton>
          <p className="text-xs text-muted-foreground">Or paste a different key below.</p>
        </div>
      ) : null}
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void connect();
        }}
      >
        <FieldInput id="em-private-key" field={{ key: "private_key", label: `${provider.name} private API key`, hint: "Settings → API keys → Create private key, with the scopes below." }} value={key} secret placeholder="Paste it here" onChange={setKey} />
        {problem ? <p className="text-sm text-destructive" role="alert">{problem}</p> : null}
        <RoleButton need={["email_marketing.manage", "integrations.manage"]} type="submit" disabled={actions.busy !== null || key.trim().length === 0}>
          Connect {provider.name}
        </RoleButton>
        <p className="text-xs text-muted-foreground">Keys are stored encrypted. Only an owner can reveal one, and every reveal is logged.</p>
      </form>
    </>
  );

  return (
    <SettingsPanel title="Connection" description="The email platform this employee runs through. It stays the system of record and does the sending." id="connection">
      <div className="space-y-4 px-5 py-4 sm:px-6">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Email platform</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {EMAIL_PROVIDER_ORDER.map((k) => {
              const p = EMAIL_PROVIDERS[k];
              return (
                <label key={k} className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm", p.available ? "cursor-pointer" : "cursor-not-allowed opacity-60", chosen === k ? "border-primary bg-primary/5" : "border-border")}>
                  <input type="radio" name="provider" className="mt-1 accent-primary" disabled={!p.available || connected} checked={chosen === k} onChange={() => setChosen(k)} />
                  <span>
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.available ? p.kind : `${p.kind} · coming soon`}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <KlaviyoNoticeLine notice={notice} />

        {connected && oauthConnected && oauth ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone="success">Connected with Klaviyo</StatusBadge>
              <span className="font-medium">{c.accountName}</span>
              {c.connectedAt ? <span className="text-muted-foreground">since {formatTime(c.connectedAt)}</span> : null}
              <RoleButton need="email_marketing.manage" size="sm" variant="outline" className="ml-auto" disabled={actions.busy !== null} onClick={() => void syncNowClicked()}>
                <RefreshCw aria-hidden />
                Sync now
              </RoleButton>
              <KlaviyoDisconnectButton onDisconnected={afterOAuthDisconnect} />
            </div>
            <KlaviyoScopeList scopes={oauth.scopes} />
          </div>
        ) : connected ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
            <StatusBadge tone="success">Connected</StatusBadge>
            <span className="font-medium">{c.accountName}</span>
            {c.connectedAt ? <span className="text-muted-foreground">since {formatTime(c.connectedAt)}</span> : null}
            <RoleButton need="email_marketing.manage" size="sm" variant="outline" className="ml-auto" disabled={actions.busy !== null} onClick={() => void syncNowClicked()}>
              <RefreshCw aria-hidden />
              Sync now
            </RoleButton>
            <RoleButton need={["email_marketing.manage", "integrations.manage"]} size="sm" variant="outline" disabled={actions.busy !== null} onClick={() => void disconnect()}>
              <Unplug aria-hidden />
              Disconnect
            </RoleButton>
          </div>
        ) : c.status === "needs_attention" ? (
          <div className="space-y-2 rounded-xl border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
            <p>
              <span className="font-medium">{provider.name} needs attention.</span> {c.problem ?? "Some of what the employee needs could not be read."}
            </p>
            <div className="flex flex-wrap gap-2">
              {klaviyoChosen && oauth?.available ? (
                <KlaviyoConnectButton returnPath={KLAVIYO_EMAIL_RETURN} label="Reconnect with Klaviyo" size="sm" />
              ) : null}
              <RoleButton need={["email_marketing.manage", "integrations.manage"]} size="sm" disabled={actions.busy !== null} onClick={() => void actions.run("connect", () => connectProvider(null))}>
                Check again
              </RoleButton>
              <RoleButton need={["email_marketing.manage", "integrations.manage"]} size="sm" variant="outline" disabled={actions.busy !== null} onClick={() => void disconnect()}>
                <Unplug aria-hidden />
                Disconnect
              </RoleButton>
            </div>
            <p className="text-xs text-muted-foreground">To use a new key, disconnect and connect again with it.</p>
          </div>
        ) : (
          <div className="max-w-lg space-y-3">
            {oauthConnected ? (
              <div className="space-y-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
                <p>Klaviyo is signed in on the Integrations page.</p>
                <RoleButton need={["email_marketing.manage", "integrations.manage"]} size="sm" disabled={actions.busy !== null} onClick={() => void connectSaved("sign-in")}>
                  Connect with the Klaviyo sign-in
                </RoleButton>
              </div>
            ) : null}
            {offerSignIn ? (
              <div className="space-y-2">
                <KlaviyoConnectButton returnPath={KLAVIYO_EMAIL_RETURN} />
                <p className="text-xs text-muted-foreground">Press Allow on Klaviyo&apos;s screen and you come straight back here, connected. Nothing to copy.</p>
              </div>
            ) : null}
            {offerSignIn ? (
              <details className="group" open={keyOpen} onToggle={(event) => setKeyOpen(event.currentTarget.open)}>
                <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="size-4 transition-transform duration-200 group-open:rotate-90" aria-hidden />
                  Use a private API key instead
                </summary>
                <div className="mt-3 space-y-3">{keyForm}</div>
              </details>
            ) : (
              keyForm
            )}
          </div>
        )}
        {banner ? (
          <p role="status" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <KeyRound className="size-4 shrink-0" aria-hidden />
            <span className="font-medium text-foreground">{banner.title}.</span>
            {banner.body}
            <Link href="/integrations" prefetch={false} className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Open Integrations
            </Link>
          </p>
        ) : null}
        {workspace.snapshotAt && age ? (
          <p className={cn("text-sm", age.stale ? "text-warning" : "text-muted-foreground")}>
            Reports as of {formatTime(workspace.snapshotAt)}
            {age.stale ? ` — ${age.hours} hours old` : " · refreshed nightly"}
          </p>
        ) : connected ? (
          <p className="text-sm text-muted-foreground">No report yet — the first is read tonight.</p>
        ) : null}
        {note ? <p className="text-sm text-muted-foreground" role="status">{note}</p> : null}
        {actions.error ? <p className="text-sm text-destructive" role="alert">{actions.error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{oauthConnected && connected ? "Scopes granted" : "Scopes the key needs"}</p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {(c.scopes.length > 0 ? c.scopes : provider.scopes.map((scope) => ({ scope, granted: false }))).map((s) => (
                <li key={s.scope} className="flex items-center gap-1.5 font-mono">
                  {s.granted ? <CheckCircle2 className="size-3.5 text-success" aria-label="granted" /> : <CircleDashed className="size-3.5 text-muted-foreground" aria-label="not checked" />}
                  {s.scope}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">What {provider.name} limits</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {provider.limits.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SettingsPanel>
  );
}
