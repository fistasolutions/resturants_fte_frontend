"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { StepAudience } from "@/features/email-marketing/campaigns/builder/step-audience";
import { StepContent } from "@/features/email-marketing/campaigns/builder/step-content";
import { StepGoal } from "@/features/email-marketing/campaigns/builder/step-goal";
import { StepOffer } from "@/features/email-marketing/campaigns/builder/step-offer";
import { StepSchedule } from "@/features/email-marketing/campaigns/builder/step-schedule";
import { StepTest } from "@/features/email-marketing/campaigns/builder/step-test";
import { NotConnected } from "@/features/email-marketing/not-connected";
import { PreSendPanel } from "@/features/email-marketing/pre-send-panel";
import { TabSkeleton } from "@/features/email-marketing/skeletons";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { useSendContext } from "@/features/email-marketing/use-send-context";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import {
  BUILDER_STEPS,
  campaignToDraft,
  draftToCampaign,
  draftToInput,
  estimateRecipients,
  initialDraft,
  STEP_LABELS,
  stepProblem,
  type BuilderDraft,
  type BuilderStep,
} from "@/lib/email-builder";
import type { BestTimeState } from "@/lib/email-brain";
import { EMAIL_MARKETING_BASE, EMAIL_MARKETING_TITLE, emailTabHref, formatMoney, formatMoneyRange, voiceCheck } from "@/lib/email-marketing";
import { isoDate } from "@/lib/email-plan";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { cn } from "@/lib/utils";
import { approveCampaign, saveCampaign, sendSeedTest } from "@/services/email-marketing-actions";
import type { SendContext } from "@/lib/email-builder";
import type { CampaignGoal, EmailCampaign, EmailContent, EmailWorkspace } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

function Stepper({ step, reached, onGo }: { step: BuilderStep; reached: number; onGo: (s: BuilderStep) => void }) {
  const current = BUILDER_STEPS.indexOf(step);
  return (
    <ol className="flex flex-wrap gap-1" aria-label="Campaign steps">
      {BUILDER_STEPS.map((s, i) => {
        const done = i < current;
        const open = i <= reached;
        return (
          <li key={s}>
            <button
              type="button"
              disabled={!open}
              aria-current={s === step ? "step" : undefined}
              onClick={() => onGo(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                s === step ? "border-foreground bg-foreground text-background" : done ? "border-border bg-card text-foreground" : "border-border text-muted-foreground",
              )}
            >
              <span className="tabular-nums">{done ? <Check className="size-3" aria-hidden /> : i + 1}</span>
              {STEP_LABELS[s]}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Builder({
  goal,
  audience,
  workspace,
  content,
  ctx,
  editing,
}: {
  goal: CampaignGoal;
  audience: string | null;
  workspace: EmailWorkspace;
  content: EmailContent;
  ctx: SendContext;
  /** A saved draft to edit in place, or null for a new campaign. */
  editing: EmailCampaign | null;
}) {
  const router = useRouter();
  const actions = useEmailMarketingActions();
  const today = useMemo(() => isoDate(new Date()), []);
  const codes = useApiQuery(emailMarketingQueries.discountCodes());
  const can = useCan();
  // Reaching the review step saves the draft; testing or approving it saves it and sends (SPEC-358).
  const saveGate = can("email_marketing.manage");
  const reviewGate = can(["email_marketing.manage", "email_marketing.send"]);
  const make = (g: CampaignGoal, id: string) =>
    initialDraft(g, {
      id,
      excluded: workspace.guardrails.excludedSegments,
      audience,
      today,
      catalog: content.catalog,
      post: content.latestPost?.title ?? null,
      sender: workspace.sender.fromName,
      audiences: ctx.audiences,
    });
  const [draft, setDraft] = useState<BuilderDraft>(() => (editing ? campaignToDraft(editing) : make(goal, "new")));
  const [step, setStep] = useState<BuilderStep>(editing ? "content" : "goal");
  const [reached, setReached] = useState(editing ? BUILDER_STEPS.length - 2 : 0);
  // The server's copy once saved: its id, recipient count, exclusions and profit are the truth.
  const [saved, setSaved] = useState<EmailCampaign | null>(editing);
  const set = (patch: Partial<BuilderDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const estimate = estimateRecipients(draft, ctx.audiences);
  const voice = voiceCheck([draft.subject, draft.previewText, ...draft.blocks.flatMap((b) => [b.title, b.body])].join(". "), content.voice);
  const local = draftToCampaign(draft, estimate, content.catalog, workspace.connection.provider, voice.score, new Date().toISOString());
  const onReview = step === "review" && saved !== null;
  const campaign = onReview ? saved : local;
  const index = BUILDER_STEPS.indexOf(step);
  const problem = stepProblem(step, draft, ctx.audiences);
  // SPEC-368: the audience's best hour is the server's, read from the saved draft's checks.
  const scheduleChecks = useApiQuery(step === "schedule" && saved !== null ? emailMarketingQueries.checks(saved.id) : null);
  const bestTime: BestTimeState =
    actions.busy === "save" || (saved !== null && scheduleChecks.isPending)
      ? { status: "pending" }
      : saved === null
        ? { status: "unsaved" }
        : scheduleChecks.isError
          ? { status: "error" }
          : { status: "ready", bestTime: scheduleChecks.data?.bestTime ?? null };

  /** Saves the draft (create, then update the same one) and keeps the server's answer. */
  async function persist(): Promise<EmailCampaign> {
    const next = await saveCampaign(draftToInput(draft), saved?.id ?? null);
    setSaved(next);
    return next;
  }

  const move = (next: BuilderStep) => {
    setStep(next);
    setReached((r) => Math.max(r, BUILDER_STEPS.indexOf(next)));
    window.scrollTo({ top: 0 });
  };

  /** The review step is judged by the server, so reaching it saves the draft first. Reaching the
   * schedule step saves it too, so the server can read when this audience orders (SPEC-368). */
  async function go(next: BuilderStep) {
    if (next === "schedule" && saveGate.allowed) {
      move(next);
      await actions.run("save", persist);
      return;
    }
    if (next !== "review") return move(next);
    if (!saveGate.allowed) return;
    const done = await actions.run("save", persist);
    if (done) move(next);
  }

  async function saveDraft() {
    const done = await actions.run("save", persist);
    if (done) router.push(`${EMAIL_MARKETING_BASE}/campaigns/${done.id}`);
  }

  async function approve(typed: string | null) {
    const done = await actions.run("approve", async () => {
      const current = await persist();
      return approveCampaign(current.id, typed);
    });
    if (done) router.push(`${EMAIL_MARKETING_BASE}/campaigns/${done.id}`);
  }

  return (
    <div className="space-y-4">
      <Stepper step={step} reached={reached} onGo={(s) => void go(s)} />
      <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
        <section aria-label={STEP_LABELS[step]} className="min-w-0 rounded-2xl border border-border bg-card p-4 md:p-5">
          <h2 className="mb-4 text-base font-semibold">
            {index + 1}. {STEP_LABELS[step]}
          </h2>
          {step === "goal" ? (
            <StepGoal draft={draft} onGoal={(g) => setDraft((d) => make(g, d.id))} onName={(name) => set({ name })} />
          ) : step === "audience" ? (
            <StepAudience draft={draft} audiences={ctx.audiences} estimate={estimate} provider={workspace.connection.provider} onChange={set} />
          ) : step === "offer" ? (
            <StepOffer draft={draft} catalog={content.catalog} guardrails={workspace.guardrails} codes={codes.data ?? []} onChange={set} />
          ) : step === "content" ? (
            <StepContent draft={draft} catalog={content.catalog} voice={content.voice} fromName={workspace.sender.fromName} onChange={set} advice={content.adviceBlock} />
          ) : step === "test" ? (
            <StepTest draft={draft} recipients={estimate.recipients} onChange={set} />
          ) : step === "schedule" ? (
            <StepSchedule draft={draft} provider={workspace.connection.provider} guardrails={workspace.guardrails} today={today} bestTime={bestTime} onChange={(strategy) => set({ strategy })} />
          ) : saved === null ? null : (
            <PreSendPanel
              campaign={saved}
              ctx={ctx}
              guardrails={workspace.guardrails}
              catalog={content.catalog}
              fromName={workspace.sender.fromName}
              advice={content.adviceBlock}
              busy={actions.busy !== null || !reviewGate.allowed}
              onSendTest={() => void actions.run("test", async () => sendSeedTest((await persist()).id))}
              onApprove={(typed) => void approve(typed)}
            />
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button variant="outline" disabled={index === 0} onClick={() => void go(BUILDER_STEPS[index - 1])}>
              <ArrowLeft aria-hidden />
              Back
            </Button>
            {step !== "review" ? (
              <Button
                disabled={problem !== null || actions.busy !== null || (BUILDER_STEPS[index + 1] === "review" && !saveGate.allowed)}
                onClick={() => void go(BUILDER_STEPS[index + 1])}
              >
                Next: {STEP_LABELS[BUILDER_STEPS[index + 1]]}
                <ArrowRight aria-hidden />
              </Button>
            ) : null}
            <RoleButton
              need="email_marketing.manage"
              variant="ghost"
              disabled={actions.busy !== null || draft.name.trim().length < 3}
              onClick={() => void saveDraft()}
            >
              <Save aria-hidden />
              Save as draft
            </RoleButton>
            {!saveGate.allowed ? <p className="text-xs text-muted-foreground">{saveGate.reason}</p> : null}
            {problem ? <p className="text-xs text-warning" role="status">{problem}</p> : null}
            {actions.error ? <p className="text-xs text-destructive" role="alert">{actions.error}</p> : null}
          </div>
        </section>
        <aside className="h-fit space-y-2 rounded-2xl border border-border bg-card p-4 text-sm lg:sticky lg:top-4" aria-label="Campaign so far">
          <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">So far</p>
          <p className="font-semibold">{draft.name || "Untitled campaign"}</p>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
            <dt className="text-muted-foreground">{onReview ? "Recipients" : "Recipients, up to"}</dt>
            <dd className="text-right tabular-nums">{formatNumber(campaign.recipientEstimate)}</dd>
            <dt className="text-muted-foreground">Expected profit</dt>
            <dd className={cn("text-right tabular-nums", campaign.expectedProfit.high.amount < 0 && "text-destructive")}>{formatMoneyRange(campaign.expectedProfit)}</dd>
            <dt className="text-muted-foreground">Discount given away</dt>
            <dd className="text-right tabular-nums">{formatMoney(campaign.discountCost)}</dd>
            <dt className="text-muted-foreground">Holdout</dt>
            <dd className="text-right tabular-nums">{draft.holdoutPercent}%</dd>
            <dt className="text-muted-foreground">Brand voice</dt>
            <dd className="text-right tabular-nums">{campaign.brandVoiceScore}</dd>
          </dl>
          <p className="text-[11px] text-muted-foreground">{campaign.expectedProfit.basis}</p>
        </aside>
      </div>
    </div>
  );
}

/** The campaign builder (SPEC-345): seven steps, each one decision, with the money in view
 * the whole way and the pre-send panel as the last step. Prefilled from `?goal=` and
 * `?audience=` — the Plan, the Overview and the chat all open it already filled in. */
export function BuilderView({ goal, audience, editId = null }: { goal: CampaignGoal; audience: string | null; editId?: string | null }) {
  const state = useSendContext();
  const edited = useApiQuery(editId ? emailMarketingQueries.campaign(editId) : null);
  const title = editId ? "Edit campaign" : "New campaign";
  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb current={title} trail={[{ label: EMAIL_MARKETING_TITLE, href: emailTabHref("campaigns") }]} />
        <PageHeader title={title} description="One decision per step. Nothing sends until you approve it on the last step — and you see what it will make first." />
      </div>
      {state.status === "pending" || (editId !== null && edited.isPending) ? (
        <TabSkeleton />
      ) : state.status === "error" ? (
        <QueryErrorState error={state.error} onRetry={state.retry} />
      ) : editId !== null && edited.isError ? (
        <QueryErrorState error={edited.error} onRetry={() => void edited.refetch()} />
      ) : !state.ctx.connected ? (
        <NotConnected what="The campaign builder" />
      ) : editId !== null && edited.data && (edited.data.status !== "draft" || edited.data.source !== "fte") ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Only a draft built here can be edited. This one is {edited.data.status.replace("_", " ")}.</p>
      ) : (
        <Builder
          key={editId ?? "new"}
          goal={goal}
          audience={audience}
          workspace={state.workspace}
          content={state.content}
          ctx={state.ctx}
          editing={editId !== null ? (edited.data ?? null) : null}
        />
      )}
    </main>
  );
}
