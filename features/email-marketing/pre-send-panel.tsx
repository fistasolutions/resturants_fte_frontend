"use client";

import { useId, useState } from "react";
import { CheckCircle2, CircleAlert, FlaskConical, Send, ShieldX } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailPreview } from "@/features/email-marketing/email-preview";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { hasPickedForYou, pickFallback } from "@/lib/email-blocks";
import { BEST_TIME_UNAVAILABLE, picksSummary } from "@/lib/email-brain";
import { strategyLabel, type SendContext } from "@/lib/email-builder";
import { accessGate } from "@/lib/email-access";
import { approvalReadiness, checkTone, formatMoney, formatMoneyRange, typedConfirmMatches } from "@/lib/email-marketing";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { cn } from "@/lib/utils";
import type { AdviceBlock, CampaignPick, CatalogProduct, EmailCampaign, Guardrails } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

function Figure({ label, value, detail, tone = "default" }: { label: string; value: string; detail?: string; tone?: "default" | "good" | "bad" }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className={cn("text-lg font-bold tabular-nums", tone === "good" && "text-success", tone === "bad" && "text-destructive")}>{value}</p>
      {detail ? <p className="text-[11px] leading-snug text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

/** SPEC-368: the products the server picked for this audience, most customers first, and the
 * fallback everyone else sees. */
function PicksCard({ picks, fallback, judged }: { picks: CampaignPick[] | undefined; fallback: string | null; judged: boolean }) {
  const summary = picksSummary(picks);
  return (
    <div className="rounded-xl border border-border bg-card">
      <p className="border-b border-border px-3 py-2 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">What customers will be shown</p>
      {!judged ? (
        <div className="space-y-2 p-3" aria-label="Reading the picks">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/5" />
        </div>
      ) : summary.rows.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          Nobody in this audience has a pick yet, so everyone sees the fallback{fallback ? `: ${fallback}` : ""}.
        </p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {summary.rows.map((pick) => (
            <li key={pick.productId} className="flex justify-between gap-3 px-3 py-2">
              <span className="min-w-0 truncate">{pick.title}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatNumber(pick.customers)} customer{pick.customers === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {judged && summary.rows.length > 0 ? (
        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          The most-picked products for this audience. Anyone without a pick sees the fallback{fallback ? `, ${fallback}` : ""}.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Everything the owner must see before a send (SPEC-345 safety model): who it reaches and
 * who is left out with why, the expected profit and its basis, what the discount gives away,
 * the holdout, the guardrail checks, the brand-voice score and the email in four views.
 *
 * The recipients, exclusions and checks are the server's (`GET /campaigns/{id}/checks`,
 * backend SPEC-354) — the same verdict `approve` is gated on — so the panel, the button and
 * the backend can never disagree. Over the audience threshold the count must be typed back.
 * SPEC-368: the checks also carry the audience's best hour (named in the timing line, and an
 * approve the server would refuse when there is none) and, for a Picked for you block, the
 * products customers will be shown.
 */
export function PreSendPanel({
  campaign,
  ctx,
  guardrails,
  catalog,
  fromName,
  advice,
  busy,
  onSendTest,
  onApprove,
  approveLabel,
}: {
  campaign: EmailCampaign;
  ctx: SendContext;
  guardrails: Guardrails;
  catalog: CatalogProduct[];
  fromName: string;
  /** The store's advice block, so the preview marks it for the store's trade (SPEC-364). */
  advice?: AdviceBlock;
  busy: boolean;
  onSendTest: () => void;
  onApprove: (typed: string | null) => void;
  approveLabel?: string;
}) {
  const typedId = useId();
  const [typed, setTyped] = useState("");
  const server = useApiQuery(emailMarketingQueries.checks(campaign.id));
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  // The role's reason first, then the Klaviyo key's (SPEC-358 rule 4).
  const can = useCan();
  const roleSend = can("email_marketing.send");
  const sendGate = roleSend.allowed ? accessGate(workspace.data?.access, "send") : roleSend;
  const checks = server.data?.checks ?? [];
  const recipients = server.data?.recipients ?? campaign.recipientEstimate;
  const exclusions = server.data?.exclusions ?? campaign.exclusions;
  const readiness = approvalReadiness(checks);
  const excluded = exclusions.reduce((sum, e) => sum + e.count, 0);
  const holdout = server.data?.heldOut ?? Math.round((recipients * campaign.holdoutPercent) / 100);
  const typedOk = !readiness.needsTypedConfirm || typedConfirmMatches(typed, recipients);
  const judged = server.data !== undefined;
  const tested = ctx.seedTested.includes(campaign.id);
  const bestTime = server.data?.bestTime ?? null;
  // The server refuses a best-time send with no best hour; say so before the click.
  const bestTimeMissing = judged && campaign.strategy.kind === "best_time" && bestTime === null;
  const pickBlock = campaign.message.blocks.find((b) => b.kind === "picked_for_you");
  const fallbackId = pickBlock ? pickFallback(pickBlock) : null;
  const fallbackTitle = catalog.find((p) => p.id === fallbackId)?.title ?? null;
  const label = approveLabel ?? (campaign.strategy.kind === "immediate" ? "Approve and send now" : "Approve and schedule");

  return (
    <section className="space-y-4" aria-label="Before it sends">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Figure label="Recipients" value={formatNumber(recipients)} detail={`${judged ? "counted" : "estimate"} · ${strategyLabel(campaign.strategy, bestTime)}`} />
        <Figure label="Left out" value={formatNumber(excluded)} detail="reasons below" />
        <Figure
          label="Expected profit"
          value={formatMoneyRange(campaign.expectedProfit)}
          detail={campaign.expectedProfit.basis}
          tone={campaign.expectedProfit.high.amount < 0 ? "bad" : campaign.expectedProfit.low.amount > 0 ? "good" : "default"}
        />
        <Figure label="Discount given away" value={formatMoney(campaign.discountCost)} detail={campaign.offer.history ?? (campaign.discountCost.amount > 0 ? "on every order the code touches" : "no discount")} />
        <Figure label="Holdout" value={`${campaign.holdoutPercent}%`} detail={holdout > 0 ? `${formatNumber(holdout)} don't get it, so lift can be measured` : "no holdout — lift can't be measured"} />
        <Figure label="Brand voice" value={String(campaign.brandVoiceScore)} detail="out of 100, by your Brand Brain's rules" tone={campaign.brandVoiceScore >= 70 ? "default" : "bad"} />
      </div>

      {exclusions.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <p className="border-b border-border px-3 py-2 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">Who is left out</p>
          <ul className="divide-y divide-border text-sm">
            {exclusions.map((e) => (
              <li key={e.reason} className="flex justify-between gap-3 px-3 py-2">
                <span className="text-muted-foreground">{e.reason}</span>
                <span className="tabular-nums">{formatNumber(e.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card">
        <p className="border-b border-border px-3 py-2 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">Checks</p>
        {server.isError && server.error ? (
          <div className="p-3">
            <QueryErrorState error={server.error} onRetry={() => void server.refetch()} />
          </div>
        ) : !judged ? (
          <div className="space-y-2 p-3" aria-label="Checking the send">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-3/5" />
          </div>
        ) : null}
        <ul className="divide-y divide-border text-sm">
          {checks.map((check) => (
            <li key={check.key} className="flex items-start gap-3 px-3 py-2">
              {check.status === "pass" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              ) : check.status === "warn" ? (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              ) : (
                <ShieldX className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              )}
              <span className="w-32 shrink-0 font-medium">{check.label}</span>
              <span className="min-w-0 flex-1 text-muted-foreground">{check.reason}</span>
              <StatusBadge tone={checkTone(check.status)}>{check.status === "pass" ? "OK" : check.status === "warn" ? "Check" : "Blocks"}</StatusBadge>
            </li>
          ))}
        </ul>
      </div>

      {hasPickedForYou(campaign.message.blocks) ? <PicksCard picks={server.data?.picks} fallback={fallbackTitle} judged={judged} /> : null}

      <EmailPreview message={campaign.message} catalog={catalog} fromName={fromName} advice={advice} />

      <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3">
        {readiness.needsTypedConfirm && readiness.ready ? (
          <div className="space-y-1">
            <Label htmlFor={typedId}>Type {formatNumber(recipients)} to confirm this many recipients</Label>
            <Input id={typedId} inputMode="numeric" autoComplete="off" value={typed} onChange={(event) => setTyped(event.target.value)} className="max-w-48" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={busy || !sendGate.allowed || guardrails.seedList.length === 0} onClick={onSendTest}>
            <FlaskConical aria-hidden />
            {guardrails.seedList.length === 0
              ? "Add seed addresses in Settings to test"
              : tested
                ? "Send another test"
                : `Send a [TEST] copy to ${guardrails.seedList.length} seed address${guardrails.seedList.length === 1 ? "" : "es"}`}
          </Button>
          <Button disabled={busy || !sendGate.allowed || !judged || bestTimeMissing || !readiness.ready || !typedOk} onClick={() => onApprove(readiness.needsTypedConfirm ? typed : null)}>
            <Send aria-hidden />
            {label}
          </Button>
          <p className="text-xs text-muted-foreground" role="status">
            {!sendGate.allowed
              ? sendGate.reason
              : !judged
              ? "Checking the send…"
              : bestTimeMissing
              ? BEST_TIME_UNAVAILABLE
              : !readiness.ready
              ? `${readiness.blockers.length} check${readiness.blockers.length === 1 ? "" : "s"} must pass first: ${readiness.blockers.map((b) => b.label.toLowerCase()).join(", ")}.`
              : readiness.warnings.length > 0
                ? `Ready, with ${readiness.warnings.length} thing${readiness.warnings.length === 1 ? "" : "s"} to check above.`
                : "Ready to send."}
          </p>
        </div>
      </div>
    </section>
  );
}
