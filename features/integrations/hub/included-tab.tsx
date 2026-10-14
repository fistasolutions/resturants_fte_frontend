"use client";

import { useState } from "react";
import { KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { GlispIcon } from "@/components/shared/glisp-icon";
import { AiProvidersCard } from "@/features/integrations/ai-providers-card";
import { AppLogo } from "@/features/integrations/hub/app-logo";
import { KeySettingsPanel } from "@/features/integrations/hub/key-settings-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { money } from "@/lib/billing-settings";
import { APPS, SMTP_FIELDS } from "@/lib/integration-catalog";
import { billingQueries } from "@/lib/queries/billing";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";
import type { HubConnection, IntegrationSettings } from "@/types/integrations";

/** The platform's AI and mail currency (backend `BILLING_CURRENCY`). */
const BILLING_CURRENCY = "USD";

function Managed({ label = "Managed for you" }: { label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
      <ShieldCheck className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs">{children}</section>;
}

function SwitchRow({
  id,
  title,
  body,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  body: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-t pt-4">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-semibold">
          {title}
        </label>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function AiAllowance() {
  const query = useApiQuery(billingQueries.allowance(), { retry: false });
  // A member without billing access simply does not see the meter.
  if (query.isPending || query.isError) return null;
  const a = query.data;
  if (a.unmetered) {
    return <p className="text-sm text-muted-foreground">No monthly AI limit on this account.</p>;
  }
  const percent = a.allowance_cents > 0 ? Math.min(100, Math.round((a.used_cents / a.allowance_cents) * 100)) : 0;
  const resets = new Date(a.resets_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          <span className="text-xl font-semibold tabular-nums">{money(a.used_cents, BILLING_CURRENCY)}</span>{" "}
          <span className="text-muted-foreground">of {money(a.allowance_cents, BILLING_CURRENCY)} this month</span>
        </span>
        <span className="text-xs text-muted-foreground">Resets {resets}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="AI used this month"
      >
        <span
          className={cn("block h-full rounded-full", percent >= 90 ? "bg-warning" : "bg-foreground")}
          style={{ width: `${percent}%` }}
        />
      </div>
      {a.own_key_cents > 0 ? (
        <p className="text-xs text-muted-foreground">
          {money(a.own_key_cents, BILLING_CURRENCY)} ran on your own key and did not count.
        </p>
      ) : null}
    </div>
  );
}

function AiCard() {
  const providers = useApiQuery(integrationQueries.aiProviders());
  const ownKey = providers.data?.providers.some((card) => card.source === "database") ?? false;
  const [open, setOpen] = useState<boolean | null>(null);
  const on = open ?? ownKey;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border bg-muted">
          <GlispIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[15px] font-semibold">Glisp and the AI employees</h4>
          <p className="text-sm text-muted-foreground">Chat, reports, writing, images and voice.</p>
        </div>
        <Managed />
      </div>
      <AiAllowance />
      <SwitchRow
        id="own-ai-key"
        title="Use your own AI key"
        body="AI runs on your provider account and your provider bills you for it."
        checked={on}
        onChange={setOpen}
      />
      {on ? <AiProvidersCard embedded /> : null}
    </Card>
  );
}

function EmailCard({ settings }: { settings: IntegrationSettings }) {
  const smtp = settings.smtp;
  const own = Object.values(smtp.fields).some((f) => f.source === "database");
  const [open, setOpen] = useState<boolean | null>(null);
  const on = open ?? own;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border bg-muted">
          <Mail className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[15px] font-semibold">Email delivery</h4>
          <p className="text-sm text-muted-foreground">Morning Brief, reports, alerts and manager emails.</p>
        </div>
        <Managed label={own ? "Your mail server" : "Managed for you"} />
      </div>
      <p className="text-sm text-muted-foreground">
        {own
          ? `Emails go out through ${smtp.fields.host?.value ?? "your server"}, from ${smtp.fields.from_email?.value ?? "your address"}.`
          : "Emails go out through the platform's mail server under your store's name. Nothing to set up."}
      </p>
      <SwitchRow
        id="own-mail-server"
        title="Send from your own mail server"
        body="Use your SMTP server so every email comes from your own address."
        checked={on}
        onChange={setOpen}
      />
      {on ? (
        <KeySettingsPanel
          provider="smtp"
          testKey="smtp"
          name="Email delivery"
          fields={SMTP_FIELDS.fields}
          secrets={SMTP_FIELDS.secrets}
          settings={smtp}
          canDisconnect={false}
          embedded
        />
      ) : null}
    </Card>
  );
}

/** Included in your plan (SPEC-328): what the platform runs for the store — nothing to set
 * up — and the switch to bring your own for the two that allow it. */
export function IncludedTab({
  settings,
  connections,
}: {
  settings: IntegrationSettings;
  connections: HubConnection[];
}) {
  const byKey = new Map(connections.map((c) => [c.key, c]));
  const shopify = byKey.get("shopify");
  const scopes = (shopify?.account?.scopes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const signIns = (["gsc", "meta", "quickbooks"] as const).map((key) => ({
    name: APPS[key].vendor ?? APPS[key].name,
    ready: byKey.get(key)?.available ?? false,
  }));

  return (
    <>
      <p className="flex items-start gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        These run on the platform&apos;s own accounts, so there is nothing to set up. You can switch AI and email to
        your own accounts.
      </p>
      <AiCard />
      <EmailCard settings={settings} />
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start gap-3">
            <AppLogo src={APPS.shopify.logo} />
            <div className="min-w-0 flex-1">
              <h4 className="text-[15px] font-semibold">Shopify app</h4>
              <p className="text-sm text-muted-foreground">How your store connects. Read-only access.</p>
            </div>
            <Managed label="Read-only" />
          </div>
          {scopes.length ? (
            <div className="flex flex-wrap gap-1.5">
              {scopes.map((scope) => (
                <span key={scope} className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                  {scope}
                </span>
              ))}
            </div>
          ) : null}
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lock className="mt-px size-3.5 shrink-0" aria-hidden />
            No write access is asked for. To remove access, uninstall the app from your Shopify admin.
          </p>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border bg-muted">
              <KeyRound className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-[15px] font-semibold">Sign-in with Google, Meta and Intuit</h4>
              <p className="text-sm text-muted-foreground">
                The platform&apos;s own apps handle these sign-ins, so you never need a developer account.
              </p>
            </div>
          </div>
          <dl className="grid gap-2 sm:grid-cols-3">
            {signIns.map((item) => (
              <div key={item.name} className="rounded-lg border bg-muted/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{item.name}</dt>
                <dd className={cn("text-sm font-semibold", !item.ready && "text-muted-foreground")}>
                  {item.ready ? "Ready" : "Not set up yet"}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
