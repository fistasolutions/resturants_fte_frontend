"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Clapperboard, CreditCard, ExternalLink, FileText, Gauge, LoaderCircle, Package } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PanelHint, SettingsPanel } from "@/features/settings/settings-panel";
import { BillingSkeleton } from "@/features/settings/settings-skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  portalFailure,
  toAllowance,
  type TopupPack,
  toMedia,
  toPlanOptions,
  toSubscription,
  type AllowanceView,
  type InvoiceView,
  type MediaView,
  type PlanOption,
  type SubscriptionView,
  type Tone,
} from "@/lib/billing-settings";
import { billingQueries } from "@/lib/queries/billing";
import { teamQueries } from "@/lib/queries/team";
import { can } from "@/lib/team";
import { cn } from "@/lib/utils";
import {
  choosePlanDirect,
  confirmPlanCheckout,
  openBillingPortal,
  startPlanCheckout,
  buyAiCredit,
} from "@/services/settings-actions";
import { formatDate } from "@/utils/format";
import { AI_INCLUDED } from "@/lib/pricing";

/**
 * Settings → Billing & plan (SPEC-324 over backend SPEC-331): the plan, the AI allowance, the
 * card and the invoices. The card, receipts and cancellation live in Stripe's own portal; a plan
 * change goes through Stripe Checkout and comes back here (`?session_id=`, confirmed once). Only
 * `billing.manage` may change anything; `billing.view` reads.
 */

const TONE: Record<Tone, StatusTone> = {
  success: "success",
  warning: "warning",
  destructive: "destructive",
  muted: "neutral",
};

type Notice = { tone: "success" | "error"; text: string } | null;

export function BillingTab() {
  const plans = useApiQuery(billingQueries.plans());
  const subscription = useApiQuery(billingQueries.subscription());
  const allowance = useApiQuery(billingQueries.allowance());
  const topupPacks = useApiQuery(billingQueries.topupPacks());
  const invoices = useApiQuery(billingQueries.invoices());
  const access = useApiQuery(teamQueries.access());
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const [changing, setChanging] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const sessionId = params.get("session_id");
  const cancelled = params.get("checkout") === "cancelled";
  const [notice, setNotice] = useState<Notice>(() =>
    cancelled ? { tone: "error", text: "Checkout was cancelled — your plan has not changed." } : null,
  );
  const confirmed = useRef(false);
  const topupReturn = params.get("topup");

  useEffect(() => {
    if (!sessionId || confirmed.current) return;
    confirmed.current = true;
    confirmPlanCheckout(sessionId)
      .then(() => setNotice({ tone: "success", text: "Your new plan is active." }))
      .catch((failure: unknown) =>
        setNotice({
          tone: "error",
          text: failure instanceof Error && failure.message ? failure.message : "The payment could not be confirmed yet.",
        }),
      )
      .finally(() => {
        void queryClient.invalidateQueries({ queryKey: ["billing"] });
        router.replace("/settings/billing");
      });
  }, [sessionId, queryClient, router]);

  useEffect(() => {
    if (topupReturn !== "ok") return;
    setNotice({ tone: "success", text: "Your AI credit has been added for this month." });
    void queryClient.invalidateQueries({ queryKey: ["billing"] });
    router.replace("/settings/billing");
  }, [topupReturn, queryClient, router]);

  useEffect(() => {
    if (cancelled) router.replace("/settings/billing");
  }, [cancelled, router]);

  if (plans.isPending || subscription.isPending || allowance.isPending || access.isPending) {
    return <BillingSkeleton />;
  }
  const failed = plans.error ?? subscription.error ?? allowance.error;
  if (failed) {
    return (
      <QueryErrorState
        error={failed}
        onRetry={() => void Promise.all([plans.refetch(), subscription.refetch(), allowance.refetch()])}
      />
    );
  }

  // `useApiQuery` holds data back during hydration for a non-default store locale.
  if (!plans.data || !allowance.data || subscription.data === undefined) return <BillingSkeleton />;

  const manage = access.data ? can(access.data, "billing.manage") : false;
  const catalogue = plans.data.plans;
  const current = subscription.data ? toSubscription(subscription.data, catalogue) : null;
  const usage = toAllowance(allowance.data, catalogue[0]?.currency ?? "USD");
  const media = toMedia(allowance.data);
  const stripe = plans.data.payment.provider === "stripe";

  async function openPortal() {
    setPortalBusy(true);
    setNotice(null);
    try {
      window.location.assign(await openBillingPortal());
    } catch (failure) {
      setNotice({ tone: "error", text: portalFailure(failure) });
      setPortalBusy(false);
    }
  }

  /** SPEC-384: buy AI credit for this month. Stripe → redirect; dummy → granted now. */
  async function buyCredit(creditCents: number): Promise<boolean> {
    setNotice(null);
    const result = await buyAiCredit(creditCents);
    if (result.checkout_url) {
      window.location.assign(result.checkout_url);
      return false; // leaving the page
    }
    setNotice({ tone: "success", text: "Your AI credit has been added for this month." });
    await queryClient.invalidateQueries({ queryKey: ["billing"] });
    return true; // granted, close the dialog
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {notice ? (
        <p role="status" className={notice.tone === "error" ? "text-sm text-destructive" : "text-sm text-success"}>
          {notice.text}
        </p>
      ) : null}

      <PlanPanel
        current={current}
        manage={manage}
        stripe={stripe}
        portalBusy={portalBusy}
        onChange={() => setChanging(true)}
        onPortal={() => void openPortal()}
      />
      <AllowancePanel usage={usage} manage={manage} packs={topupPacks.data ?? []} onBuy={buyCredit} />
      {media ? <MediaPanel media={media} resetsAt={usage.resetsAt} /> : null}
      <InvoicesPanel invoices={invoices.data ?? []} pending={invoices.isPending} failed={invoices.isError} onRetry={() => void invoices.refetch()} />

      {manage ? (
        <ChangePlanDialog
          open={changing}
          onOpenChange={setChanging}
          plans={toPlanOptions(catalogue)}
          currentKey={current?.planKey ?? null}
          stripe={stripe}
          onChosen={async (text) => {
            setChanging(false);
            setNotice({ tone: "success", text });
            await queryClient.invalidateQueries({ queryKey: ["billing"] });
          }}
        />
      ) : null}
    </div>
  );
}

function PlanPanel({
  current,
  manage,
  stripe,
  portalBusy,
  onChange,
  onPortal,
}: {
  current: SubscriptionView | null;
  manage: boolean;
  stripe: boolean;
  portalBusy: boolean;
  onChange: () => void;
  onPortal: () => void;
}) {
  if (!current) {
    return (
      <SettingsPanel
        title="No plan yet"
        icon={Package}
        description="Choose the plan that fits your store's annual revenue. Every plan includes every connection, Glisp and all AI employees."
        action={manage ? <Button onClick={onChange}>Choose a plan</Button> : null}
      />
    );
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs" aria-labelledby="plan-title">
      <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="plan-title" className="text-lg font-semibold tracking-tight">
              {current.planName}
            </h2>
            <StatusBadge tone={TONE[current.statusTone]}>{current.statusLabel}</StatusBadge>
          </div>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
            {current.price}
            <span className="ml-1 text-sm font-normal text-muted-foreground">/ {current.interval} · per store</span>
          </p>
          {current.band ? <p className="mt-1 text-sm text-muted-foreground">For stores with {current.band} annual revenue</p> : null}
        </div>
        {manage ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={onChange}>Change plan</Button>
            {stripe && current.paidThroughStripe ? (
              <Button variant="outline" onClick={onPortal} disabled={portalBusy}>
                {portalBusy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ExternalLink className="size-4" aria-hidden />}
                Manage in Stripe
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <dl className="grid grid-cols-1 border-t border-border sm:grid-cols-3">
        {[
          { label: current.status === "canceled" ? "Ends" : "Renews", value: formatDate(current.renewsAt) },
          { label: "Billing cycle", value: current.interval === "year" ? "Yearly" : "Monthly" },
          { label: "Customer since", value: formatDate(current.startedAt) },
        ].map((item) => (
          <div
            key={item.label}
            className="border-t border-border px-5 py-4 first:border-t-0 sm:border-t-0 sm:border-l sm:first:border-l-0 sm:px-6"
          >
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      {manage && stripe && current.paidThroughStripe ? (
        <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-5 py-3 text-sm text-muted-foreground sm:px-6">
          <CreditCard className="size-4" aria-hidden />
          Update your card, download receipts or cancel from Stripe&apos;s secure portal.
        </div>
      ) : null}
    </section>
  );
}

function AllowancePanel({
  usage,
  manage,
  packs,
  onBuy,
}: {
  usage: AllowanceView;
  manage: boolean;
  packs: TopupPack[];
  onBuy: (creditCents: number) => Promise<boolean>;
}) {
  const [adding, setAdding] = useState(false);
  const fill = { success: "bg-success", warning: "bg-warning", destructive: "bg-destructive", muted: "bg-muted-foreground" }[
    usage.tone
  ];
  // SPEC-384: an unmetered org has nothing to top up; only billing.manage may buy.
  const canTopup = !usage.unmetered && manage && packs.length > 0;
  return (
    <SettingsPanel
      title="AI allowance"
      icon={Gauge}
      action={
        canTopup ? (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            Add AI credit
          </Button>
        ) : null
      }
      description={
        usage.unmetered
          ? "AI is included in your agreement — nothing is counted against an allowance."
          : `The platform AI your plan includes this month. It resets on ${formatDate(usage.resetsAt)}.`
      }
      footer={
        usage.hasOwnKeyUse ? (
          <PanelHint>
            {usage.ownKeys} ran on your own AI keys this month and was not counted.
          </PanelHint>
        ) : (
          <PanelHint>Add your own AI key in Integrations and AI stops counting against the allowance.</PanelHint>
        )
      }
    >
      {canTopup ? (
        <AddCreditDialog open={adding} onOpenChange={setAdding} packs={packs} onBuy={onBuy} />
      ) : null}
      {usage.unmetered ? null : (
        <div className="space-y-3 px-5 py-5 sm:px-6">
          {/* SPEC-374: the share of this month's AI used — never the dollar figure. */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">{usage.percent}%</span>
            <span className="text-sm text-muted-foreground">of this month&rsquo;s AI used</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-secondary"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={usage.percent}
            aria-label="Share of this month's AI used"
          >
            <div className={cn("h-full rounded-full", fill)} style={{ width: `${usage.percent}%` }} />
          </div>
          {usage.tone === "destructive" ? (
            <p className="text-sm font-medium text-destructive">
              You&rsquo;ve used this month&rsquo;s AI — it resets on {formatDate(usage.resetsAt)}.
            </p>
          ) : usage.tone === "warning" ? (
            <p className="text-sm font-medium text-warning">You&rsquo;re running low on this month&rsquo;s AI.</p>
          ) : null}
          {usage.topupCents > 0 ? (
            <p className="text-xs text-muted-foreground">
              Includes {usage.topup} of extra AI added this month.
            </p>
          ) : null}
        </div>
      )}
    </SettingsPanel>
  );
}

/** SPEC-384: pick a pack of AI credit to buy for this month — the price is 3x the AI value. */
function AddCreditDialog({
  open,
  onOpenChange,
  packs,
  onBuy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packs: TopupPack[];
  onBuy: (creditCents: number) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(creditCents: number) {
    setBusy(creditCents);
    setError(null);
    try {
      if (await onBuy(creditCents)) onOpenChange(false);
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : "That could not be bought.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add AI credit</DialogTitle>
          <DialogDescription>
            Extra AI for this month only — it is added to your allowance and resets on the 1st. Your
            plan does not change.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {packs.map((pack) => (
            <button
              key={pack.creditCents}
              type="button"
              disabled={busy !== null}
              onClick={() => void pick(pack.creditCents)}
              className="flex items-center justify-between rounded-xl border px-4 py-3 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <span className="text-sm font-semibold">{pack.credit} of AI</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {busy === pack.creditCents ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : (
                  pack.price
                )}
              </span>
            </button>
          ))}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** SPEC-327: the package's videos and images this month — used, of how many, reset date. */
function MediaPanel({ media, resetsAt }: { media: MediaView; resetsAt: string }) {
  const fill = { success: "bg-success", warning: "bg-warning", destructive: "bg-destructive", muted: "bg-muted-foreground" };
  return (
    <SettingsPanel
      title="Videos & images this month"
      icon={Clapperboard}
      description={
        media.unmetered
          ? "Included in your agreement — nothing is counted against a limit."
          : `What your package includes each month. It resets on ${formatDate(resetsAt)}.`
      }
    >
      {media.unmetered ? null : (
        <ul className="divide-y divide-border">
          {media.rows.map((row) => (
            <li key={row.key} className="space-y-2 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-medium">{row.label}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {row.noLimit ? "No limit on your package" : row.summary}
                  {row.extra ? ` · ${row.extra}` : ""}
                </span>
              </div>
              {row.percent === null ? (
                <p className="text-xs text-muted-foreground">{row.summary} this month</p>
              ) : (
                <div
                  className="h-2 overflow-hidden rounded-full bg-secondary"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={row.percent}
                  aria-label={`${row.label} used`}
                >
                  <div className={cn("h-full rounded-full", fill[row.tone])} style={{ width: `${row.percent}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SettingsPanel>
  );
}

function InvoicesPanel({
  invoices,
  pending,
  failed,
  onRetry,
}: {
  invoices: InvoiceView[];
  pending: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  return (
    <SettingsPanel title="Invoices" icon={FileText} description="Every invoice Stripe has issued for your plan, newest first.">
      {pending ? (
        <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground sm:px-6">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Reading your invoices from Stripe…
        </p>
      ) : failed ? (
        <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
          Stripe could not be reached.{" "}
          <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={onRetry}>
            Try again
          </button>
        </p>
      ) : invoices.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">No invoices yet. They appear here after your first payment.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 sm:pl-6">Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 sm:pr-6">
                  <span className="sr-only">Open</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="pl-5 tabular-nums sm:pl-6">{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs">{invoice.number}</TableCell>
                  <TableCell className="hidden max-w-[28rem] truncate text-muted-foreground md:table-cell">{invoice.description}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{invoice.amount}</TableCell>
                  <TableCell>
                    <StatusBadge tone={TONE[invoice.statusTone]}>{invoice.statusLabel}</StatusBadge>
                  </TableCell>
                  <TableCell className="pr-5 text-right sm:pr-6">
                    {invoice.url ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.url} target="_blank" rel="noreferrer">
                          View
                          <span className="sr-only"> invoice {invoice.number}</span>
                        </a>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SettingsPanel>
  );
}

function ChangePlanDialog({
  open,
  onOpenChange,
  plans,
  currentKey,
  stripe,
  onChosen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: PlanOption[];
  currentKey: string | null;
  stripe: boolean;
  onChosen: (message: string) => Promise<void>;
}) {
  const [chosen, setChosen] = useState<string | null>(currentKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = plans.find((p) => p.key === chosen) ?? null;
  const unchanged = !selected || selected.key === currentKey;

  async function confirm() {
    if (!selected || unchanged) return;
    setBusy(true);
    setError(null);
    try {
      if (stripe) {
        window.location.assign(await startPlanCheckout(selected.key));
        return;
      }
      await choosePlanDirect(selected.key);
      setBusy(false);
      await onChosen(`You're on ${selected.name} now.`);
    } catch (failure) {
      setBusy(false);
      setError(failure instanceof Error && failure.message ? failure.message : "The plan could not be changed.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setChosen(currentKey);
          setError(null);
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            The price follows your store&apos;s annual revenue. Every plan includes every connection, Glisp and all AI employees.
          </DialogDescription>
        </DialogHeader>
        <div role="radiogroup" aria-label="Plans" className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {plans.map((plan) => {
            const isChosen = plan.key === chosen;
            return (
              <button
                key={plan.key}
                type="button"
                role="radio"
                aria-checked={isChosen}
                onClick={() => setChosen(plan.key)}
                className={cn(
                  "relative flex flex-col gap-1.5 rounded-xl border bg-card p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isChosen ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-muted-foreground",
                )}
              >
                {plan.key === currentKey ? (
                  <span className="absolute top-3 right-3 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">Current</span>
                ) : null}
                <span className="text-sm font-semibold">{plan.name}</span>
                <span className="text-xs text-muted-foreground">{plan.band}</span>
                <span className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                  {plan.price}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/ {plan.interval}</span>
                </span>
                <span className="text-xs text-muted-foreground">{AI_INCLUDED}</span>
                {plan.seats ? <span className="text-xs text-muted-foreground">{plan.seats}</span> : null}
              </button>
            );
          })}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter className="items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {stripe ? "You'll confirm the payment on Stripe's secure checkout." : "Payments are not set up yet — the plan changes right away."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void confirm()} disabled={busy || unchanged}>
              {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              {unchanged ? "Current plan" : `Switch to ${selected?.name}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
