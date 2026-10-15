"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, CreditCard } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { connectPayments, disconnectPayments } from "@/services/restaurant-os-actions";
import { formatDateTime } from "@/utils/format";

/** A franchisee's own Stripe account (SPEC-380 / backend SPEC-395). Secrets are write-only: the form
 * never shows a stored one, and leaving the secret empty keeps it. */
export function PaymentsPanel({ franchiseeId }: { franchiseeId: number }) {
  const queryClient = useQueryClient();
  const account = useApiQuery(restaurantQueries.paymentAccount(franchiseeId));
  const [publishable, setPublishable] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [webhook, setWebhook] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (account.isError) return <QueryErrorState error={account.error} onRetry={() => void account.refetch()} />;
  if (!account.data) return <RestaurantSkeleton tiles={0} />;
  const a = account.data;
  const pk = publishable ?? a.publishableKey ?? "";

  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      setSecret("");
      setWebhook("");
      setPublishable(null);
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "payment-account", franchiseeId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!a.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(a.webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Panel
      title="Card payments"
      aside={
        a.connected ? (
          <Badge variant="outline">
            Stripe · {a.mode === "live" ? "live" : "test mode"}
          </Badge>
        ) : (
          <Badge variant="outline">Not connected</Badge>
        )
      }
    >
      <div className="space-y-4 p-4">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <CreditCard className="mt-0.5 size-4 shrink-0" aria-hidden />
          {a.connected
            ? "Guests can pay by card when they order online from this franchise's branches. The money goes straight to this Stripe account."
            : "Connect this franchise's own Stripe account so guests can pay by card when they order online. Card money goes to the franchise, never through the brand."}
        </p>
        {a.connected ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Publishable key</dt>
              <dd className="truncate font-mono text-xs text-foreground">{a.publishableKey}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Checked</dt>
              <dd className="text-foreground">{a.verifiedAt ? formatDateTime(a.verifiedAt) : "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">
                Webhook URL {a.webhookConfigured ? "· signing secret saved" : "· add the signing secret below"}
              </dt>
              <dd className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1 text-xs text-foreground">{a.webhookUrl}</code>
                <Button size="sm" variant="outline" onClick={() => void copy()} aria-label="Copy the webhook URL">
                  <Copy aria-hidden /> {copied ? "Copied" : "Copy"}
                </Button>
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">
                In Stripe, add this endpoint for checkout.session.completed and checkout.session.expired. Without it, the order
                tracker still confirms each payment with Stripe.
              </p>
            </div>
            {a.lastError ? <p className="text-sm text-destructive sm:col-span-2">{a.lastError}</p> : null}
          </dl>
        ) : null}
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => connectPayments(franchiseeId, { publishableKey: pk.trim(), secretKey: secret.trim() || null, webhookSecret: webhook.trim() || null }));
          }}
        >
          <div className="space-y-1">
            <Label htmlFor={`pk-${franchiseeId}`}>Publishable key</Label>
            <Input id={`pk-${franchiseeId}`} value={pk} onChange={(e) => setPublishable(e.target.value)} placeholder="pk_live_…" autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`sk-${franchiseeId}`}>Secret key</Label>
            <Input
              id={`sk-${franchiseeId}`}
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={a.connected ? "Saved — leave empty to keep" : "sk_live_… or rk_live_…"}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`wh-${franchiseeId}`}>Webhook signing secret</Label>
            <Input
              id={`wh-${franchiseeId}`}
              type="password"
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
              placeholder={a.webhookConfigured ? "Saved — leave empty to keep" : "whsec_…"}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
            <RoleButton need={["payments.manage"]} type="submit" disabled={busy || !pk.trim() || (!a.connected && !secret.trim())}>
              {busy ? "Checking with Stripe…" : a.connected ? "Save" : "Connect"}
            </RoleButton>
            {a.connected ? (
              <RoleButton need={["payments.manage"]} type="button" variant="outline" disabled={busy} onClick={() => void run(() => disconnectPayments(franchiseeId))}>
                Disconnect
              </RoleButton>
            ) : null}
          </div>
        </form>
        <FormError message={error} />
      </div>
    </Panel>
  );
}
