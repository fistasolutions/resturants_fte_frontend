"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HubProvider, useHub } from "@/features/integrations/hub/hub-context";
import { KeySettingsPanel } from "@/features/integrations/hub/key-settings-panel";
import { Fact } from "@/features/customer-support/support-ui";
import { useSupportConnection } from "@/features/customer-support/use-support-connection";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  CAPABILITY_LABELS,
  CHANNEL_LABELS,
  HELPDESK_ORDER,
  HELPDESK_PROVIDERS,
  type CapabilityKey,
} from "@/lib/helpdesk-providers";
import { APPS } from "@/lib/integration-catalog";
import { detailHref } from "@/lib/integration-hub";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";
import type { HelpdeskProviderKey } from "@/types/customer-support";
import { formatDateTime } from "@/utils/format";

function Picker({ selected }: { selected: HelpdeskProviderKey }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Helpdesk</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {HELPDESK_ORDER.map((key) => {
          const provider = HELPDESK_PROVIDERS[key];
          const available = provider.status === "available";
          return (
            <label
              key={key}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm",
                key === selected ? "border-foreground bg-muted/40" : "border-border",
                available ? "cursor-pointer" : "cursor-not-allowed text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <input type="radio" name="helpdesk" value={key} checked={key === selected} disabled={!available} readOnly />
                {provider.name}
              </span>
              {!available ? <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-bold text-muted-foreground">Soon</span> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Capabilities({ provider }: { provider: HelpdeskProviderKey }) {
  const caps = HELPDESK_PROVIDERS[provider].capabilities;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">What the agent can do through {HELPDESK_PROVIDERS[provider].name}</p>
      <ul className="grid gap-1 sm:grid-cols-2">
        {(Object.keys(CAPABILITY_LABELS) as CapabilityKey[]).map((key) => (
          <li key={key} className={cn("flex items-center gap-1.5 text-xs", caps[key] ? "text-foreground" : "text-muted-foreground")}>
            {caps[key] ? <Check className="size-3.5 text-success" aria-label="Yes" /> : <Minus className="size-3.5" aria-label="No" />}
            {CAPABILITY_LABELS[key]}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Channels: {caps.channels.map((c) => CHANNEL_LABELS[c]).join(", ")}.</p>
    </div>
  );
}

/** Integrations' own connect dialog: the login is tried before anything is saved. A role without
 * `integrations.manage` sees it disabled with the role's reason (SPEC-364, Rule 13). */
function ConnectButton() {
  const hub = useHub();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border p-3">
      <RoleButton need="integrations.manage" onClick={() => hub.connect("gorgias")}>
        Connect Gorgias
      </RoleButton>
      <p className="text-xs text-muted-foreground">Tests the subdomain, email and key before saving — a wrong key never becomes a broken connection.</p>
    </div>
  );
}

/**
 * Settings → Connection (SPEC-346 decision 3): the helpdesk picker, and Gorgias's connection —
 * the SAME one Integrations holds. The key form is Integrations' own panel (saved keys show as
 * Saved with Reveal and Replace, never echoed), so connecting here connects there and the
 * other way round; there is no second card and no second key.
 */
export function ConnectionCard() {
  const connection = useSupportConnection();
  const settings = useApiQuery(integrationQueries.settings());
  const connected = connection.state === "connected";
  const agents = useApiQuery(connected ? gorgiasQueries.agents() : null);
  const app = APPS.gorgias;
  const provider = HELPDESK_PROVIDERS.gorgias;
  const hub = connection.hub;

  return (
    <div className="space-y-5">
      <Picker selected="gorgias" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Gorgias</p>
            {connection.state === "loading" ? (
              <Skeleton className="h-5 w-24 rounded-full" />
            ) : (
              <StatusBadge tone={connected ? (hub?.status === "attention" ? "destructive" : "success") : "neutral"}>
                {connected ? (hub?.status === "attention" ? "Needs attention" : "Connected") : "Not connected"}
              </StatusBadge>
            )}
          </div>
          {connected ? (
            <div className="space-y-1.5">
              <Fact label="Account">{settings.data?.gorgias.fields.subdomain?.value ? `${settings.data.gorgias.fields.subdomain.value}.gorgias.com` : "—"}</Fact>
              <Fact label="Agents">{agents.data ? agents.data.agents.length : agents.isError ? "—" : "…"}</Fact>
              <Fact label="Last sync">{hub?.lastSuccessAt ? formatDateTime(hub.lastSuccessAt) : "Not yet"}</Fact>
              {hub?.attention ? <p className="text-xs text-destructive">{hub.attention.message}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter the subdomain, the account email and an API key below — the same form as on Integrations.</p>
          )}
          <ul className="space-y-1 text-xs text-muted-foreground">
            {provider.auth.map((auth) => (
              <li key={auth.method}>
                {auth.method === "api_key" ? "API key (account email + key)" : "OAuth for the public app"} — {auth.live ? "available" : "coming"}
              </li>
            ))}
            {provider.rateLimit ? <li>Rate limit: {provider.rateLimit.note}</li> : null}
            <li>Replying needs a key whose Gorgias user can create messages; the agent checks this before it writes anything.</li>
          </ul>
          <Link href={detailHref("gorgias")} prefetch={false} className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">
            Open Gorgias on Integrations
          </Link>
        </div>
        <Capabilities provider="gorgias" />
      </div>
      {settings.isPending ? (
        <Skeleton className="h-48 rounded-xl" aria-hidden />
      ) : settings.isError ? (
        <QueryErrorState error={settings.error} onRetry={() => void settings.refetch()} />
      ) : (
        <HubProvider>
          {connected ? (
            <KeySettingsPanel
              provider="gorgias"
              testKey="gorgias"
              name={app.name}
              fields={app.fields ?? []}
              secrets={app.secrets ?? []}
              settings={settings.data.gorgias}
              canDisconnect
            />
          ) : (
            <ConnectButton />
          )}
        </HubProvider>
      )}
    </div>
  );
}
