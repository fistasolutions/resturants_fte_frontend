"use client";

import { Ban, PenLine } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { useConfirm } from "@/components/shared/confirm-provider";
import { buttonVariants } from "@/components/ui/button";
import { EmLink } from "@/features/email-marketing/em-link";
import { EmailPreview } from "@/features/email-marketing/email-preview";
import { PreSendPanel } from "@/features/email-marketing/pre-send-panel";
import { TabSkeleton } from "@/features/email-marketing/skeletons";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { useSendContext } from "@/features/email-marketing/use-send-context";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import { strategyLabel } from "@/lib/email-builder";
import {
  band,
  campaignChip,
  EMAIL_MARKETING_BASE,
  EMAIL_MARKETING_TITLE,
  emailTabHref,
  formatMoney,
  formatRate,
  GOALS,
  liftVerdict,
  rate,
} from "@/lib/email-marketing";
import { providerInfo } from "@/lib/email-providers";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { cn } from "@/lib/utils";
import { approveCampaign, cancelCampaign, sendSeedTest } from "@/services/email-marketing-actions";
import type { CampaignResults } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

function Tile({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
      <p className="truncate text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className={cn("truncate text-lg font-bold tabular-nums", tone === "good" && "text-success", tone === "warn" && "text-warning", tone === "bad" && "text-destructive")}>{value}</p>
      {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

const BAND_TO_TONE = { good: "default", warn: "warn", bad: "bad" } as const;

function Results({ r, providerName }: { r: CampaignResults; providerName: string }) {
  const unsub = rate(r.unsubscribes, r.delivered);
  const spam = rate(r.spamComplaints, r.delivered);
  const bounce = rate(r.bounces, r.recipients);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <Tile label={`Attributed by ${providerName}`} value={formatMoney(r.attributedRevenue)} sub={`${formatNumber(r.conversions)} orders`} />
      <Tile label="Caused by the email" value={r.incrementalRevenue ? formatMoney(r.incrementalRevenue) : "—"} sub={r.holdoutSize > 0 ? `vs ${formatNumber(r.holdoutSize)} held out` : "no holdout"} />
      <Tile label="Profit" value={r.profit ? formatMoney(r.profit) : "—"} sub="after product, discount, sending" tone={r.profit ? (r.profit.amount >= 0 ? "good" : "bad") : "default"} />
      <Tile label="Revenue per recipient" value={formatMoney({ ...r.attributedRevenue, amount: r.recipients > 0 ? r.attributedRevenue.amount / r.recipients : 0 })} />
      <Tile label="Delivered" value={formatNumber(r.delivered)} sub={`${formatRate(bounce)} bounced`} tone={BAND_TO_TONE[band("bounce", bounce)]} />
      <Tile label="Open rate" value={formatRate(rate(r.opens, r.delivered))} sub="inflated by Apple Mail privacy" />
      <Tile label="Click rate (CTR)" value={formatRate(rate(r.clicks, r.delivered))} />
      <Tile label="Click-to-open (CTOR)" value={formatRate(rate(r.clicks, r.opens))} />
      <Tile label="Unsubscribes" value={formatRate(unsub)} sub={`${formatNumber(r.unsubscribes)} people`} tone={BAND_TO_TONE[band("unsubscribe", unsub)]} />
      <Tile label="Spam complaints" value={formatRate(spam)} sub={`${formatNumber(r.spamComplaints)} complaints`} tone={BAND_TO_TONE[band("spam", spam)]} />
    </div>
  );
}

/** One campaign (SPEC-345): before it sends, the pre-send panel and the approval; once
 * scheduled, a cancel; once sent, the results with what the email caused and a verdict. */
export function CampaignDetailView({ id }: { id: string }) {
  const confirm = useConfirm();
  const campaign = useApiQuery(emailMarketingQueries.campaign(id));
  const state = useSendContext();
  const actions = useEmailMarketingActions();

  const header = (title: string, description: string) => (
    <div className="space-y-2">
      <EmployeeBreadcrumb current={title} trail={[{ label: EMAIL_MARKETING_TITLE, href: emailTabHref("campaigns") }]} />
      <PageHeader title={title} description={description} />
    </div>
  );

  if (campaign.isPending || state.status === "pending") {
    return <main className="space-y-6 p-4 md:p-6">{header("Campaign", "Loading…")}<TabSkeleton /></main>;
  }
  if (campaign.isError && isNotFound(campaign.error)) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        {header("Campaign not found", "It may have been deleted in your email platform, or the link is wrong.")}
      </main>
    );
  }
  if (campaign.isError) {
    return <main className="space-y-6 p-4 md:p-6">{header("Campaign", "")}<QueryErrorState error={campaign.error} onRetry={() => void campaign.refetch()} /></main>;
  }
  if (state.status === "error") {
    return <main className="space-y-6 p-4 md:p-6">{header("Campaign", "")}<QueryErrorState error={state.error} onRetry={state.retry} /></main>;
  }
  const c = campaign.data;
  const chip = campaignChip(c.status);
  const provider = providerInfo(c.provider);
  const r = c.results;

  async function cancel() {
    const yes = await confirm({ title: `Cancel “${c!.name}”?`, body: "The scheduled send is cancelled in your email platform. Nothing goes out; you can build it again later.", confirmLabel: "Cancel the send" });
    if (yes) await actions.run("cancel", () => cancelCampaign(c!.id));
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      {header(c.name, `${GOALS[c.goal].label} · ${formatNumber(r?.recipients ?? c.recipientEstimate)} recipients · ${strategyLabel(c.strategy)}`)}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={chip.tone}>{chip.label}</StatusBadge>
        <span className="text-sm text-muted-foreground">
          {c.createdBy === "employee" ? "Built by the employee" : "Built by you"}
          {c.sendAt ? ` · ${c.status === "sent" ? "sent" : "sends"} ${new Date(c.sendAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : ""}
        </span>
        {c.status === "draft" && c.source === "fte" ? (
          <RoleGate need="email_marketing.manage">
            <EmLink href={`${EMAIL_MARKETING_BASE}/campaigns/new?edit=${encodeURIComponent(c.id)}`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "ml-auto")}>
              <PenLine aria-hidden />
              Edit
            </EmLink>
          </RoleGate>
        ) : null}
        {c.status === "scheduled" ? (
          <RoleButton need="email_marketing.send" size="sm" variant="destructive" className="ml-auto" disabled={actions.busy !== null} onClick={() => void cancel()}>
            <Ban aria-hidden />
            Cancel send
          </RoleButton>
        ) : null}
      </div>
      {actions.error ? <p role="alert" className="text-sm text-destructive">{actions.error}</p> : null}
      {c.lastError && !actions.error ? (
        <p role="status" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
          The last attempt did not go through: {c.lastError} Nothing was sent.
        </p>
      ) : null}
      {c.source === "provider" ? (
        <p className="text-sm text-muted-foreground">Built in {provider.name}, outside this employee — read here for its results.</p>
      ) : null}

      {r ? (
        <>
          <section aria-label="Verdict" className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">Verdict</p>
            <p className="mt-1 text-sm text-foreground">
              {c.verdict ?? liftVerdict(r.attributedRevenue, r.incrementalRevenue, r.profit, false, provider.name)}
            </p>
          </section>
          <Results r={r} providerName={provider.name} />
          <EmailPreview message={c.message} catalog={state.content.catalog} fromName={state.workspace.sender.fromName} advice={state.content.adviceBlock} />
        </>
      ) : (c.status === "draft" || c.status === "in_review") && c.source === "fte" ? (
        <PreSendPanel
          campaign={c}
          ctx={state.ctx}
          guardrails={state.workspace.guardrails}
          catalog={state.content.catalog}
          fromName={state.workspace.sender.fromName}
          advice={state.content.adviceBlock}
          busy={actions.busy !== null}
          onSendTest={() => void actions.run("test", () => sendSeedTest(c.id))}
          onApprove={(typed) => void actions.run("approve", () => approveCampaign(c.id, typed))}
        />
      ) : (
        <>
          {c.verdict ? (
            <p className={cn("rounded-2xl border p-4 text-sm", c.status === "failed" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card")}>{c.verdict}</p>
          ) : null}
          <EmailPreview message={c.message} catalog={state.content.catalog} fromName={state.workspace.sender.fromName} advice={state.content.adviceBlock} />
        </>
      )}
    </main>
  );
}
