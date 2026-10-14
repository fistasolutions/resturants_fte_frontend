"use client";

import { useState } from "react";
import Link from "next/link";
import { Hammer, Pause, Play } from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-provider";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlowJourney } from "@/features/email-marketing/flows/flow-journey";
import { FlowMessageDialog } from "@/features/email-marketing/flows/flow-message-dialog";
import { TabSkeleton } from "@/features/email-marketing/skeletons";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { isNotFound } from "@/lib/api-error";
import { accessGate } from "@/lib/email-access";
import { delayLabel, flowMessages, journeyHours, type FlowMessage } from "@/lib/email-flow-layout";
import { AUTONOMY, AUTONOMY_ORDER, EMAIL_MARKETING_TITLE, emailTabHref, flowChip, formatMoney, healthTone } from "@/lib/email-marketing";
import { can, providerInfo } from "@/lib/email-providers";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { buildFlow, saveFlowMessage, setFlowStatus, setProgramAutonomy } from "@/services/email-marketing-actions";
import type { AutonomyLevel } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

/** One flow (SPEC-345): what it is for and what it earns, its journey, every message
 * openable, and the status changes — turning a flow on is always a deliberate approval. */
export function FlowDetailView({ id }: { id: string }) {
  const confirm = useConfirm();
  const flow = useApiQuery(emailMarketingQueries.flow(id));
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  const content = useApiQuery(emailMarketingQueries.content());
  const actions = useEmailMarketingActions();
  const [open, setOpen] = useState<FlowMessage | null>(null);
  const roleCan = useCan();

  const crumbs = (title: string) => <EmployeeBreadcrumb current={title} trail={[{ label: EMAIL_MARKETING_TITLE, href: emailTabHref("flows") }]} />;
  if (flow.isPending || workspace.isPending || content.isPending) return <main className="space-y-6 p-4 md:p-6">{crumbs("Flow")}<TabSkeleton /></main>;
  if (flow.isError && isNotFound(flow.error)) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        {crumbs("Flow not found")}
        <PageHeader title="Flow not found" description="It may have been deleted in your email platform, or the link is wrong." />
      </main>
    );
  }
  const failed = [flow, workspace, content].find((q) => q.isError);
  if (failed?.error) return <main className="space-y-6 p-4 md:p-6">{crumbs("Flow")}<QueryErrorState error={failed.error} onRetry={() => void failed.refetch()} /></main>;
  const f = flow.data;
  const w = workspace.data;
  const c = content.data;
  if (!f || !w || !c) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        {crumbs("Flow not found")}
        <PageHeader title="Flow not found" description="This flow is not in the library." />
      </main>
    );
  }
  const chip = flowChip(f.status);
  const provider = providerInfo(f.provider);
  const messages = flowMessages(f.steps);
  const override: AutonomyLevel | undefined = f.key ? w.programAutonomy[f.key] : undefined;
  const level: string = override ?? "inherit";
  const effective: AutonomyLevel = override ?? w.autonomy;
  const blocked = w.killSwitch.active;
  const flowGate = accessGate(w.access, "flows");
  // The role's reason first, then the Klaviyo key's (SPEC-358 rule 4). Building and editing a
  // flow manage it; turning it on or to manual sends.
  const roleManage = roleCan("email_marketing.manage");
  const roleSend = roleCan("email_marketing.send");
  const buildGate = roleManage.allowed ? flowGate : roleManage;
  const statusGate = roleSend.allowed ? flowGate : roleSend;
  const shownGate = f.status === "missing" ? buildGate : statusGate;
  const autonomyGate = roleCan(["email_marketing.manage", "email_marketing.send"]);

  async function turnOn() {
    const yes = await confirm({
      title: `Turn on ${f!.name}?`,
      body: `It goes live in ${provider.name} and starts sending ${messages.length} message${messages.length === 1 ? "" : "s"} to everyone who meets its trigger, inside your guardrails (quiet hours, frequency cap, protected groups). You can set it back to manual at any time.`,
      confirmLabel: "Approve and turn on",
      destructive: false,
    });
    if (yes) await actions.run("status", () => setFlowStatus(f!.id, "live"));
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        {crumbs(f.name)}
        <PageHeader title={f.name} description={f.purpose} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={chip.tone}>{chip.label}</StatusBadge>
        {f.health !== "missing" ? <StatusBadge tone={healthTone(f.health)}>{f.health}</StatusBadge> : null}
        <span className="text-sm text-muted-foreground">{f.healthNote}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {f.status === "missing" ? (
            <RoleButton
              need="email_marketing.manage"
              size="sm"
              disabled={actions.busy !== null || !flowGate.allowed || !can(f.provider, "flowsCreate")}
              onClick={() => f.key && void actions.run("build", () => buildFlow(f.key as string))}
            >
              <Hammer aria-hidden />
              Build it as a draft
            </RoleButton>
          ) : null}
          {f.status === "draft" || f.status === "manual" ? (
            <RoleButton need="email_marketing.send" size="sm" disabled={actions.busy !== null || !flowGate.allowed || blocked} onClick={() => void turnOn()}>
              <Play aria-hidden />
              Turn on…
            </RoleButton>
          ) : null}
          {f.status === "live" ? (
            <RoleButton
              need="email_marketing.send"
              size="sm"
              variant="outline"
              disabled={actions.busy !== null || !flowGate.allowed}
              onClick={() => void actions.run("status", () => setFlowStatus(f.id, "manual"))}
            >
              <Pause aria-hidden />
              Set to manual
            </RoleButton>
          ) : null}
        </div>
      </div>
      {!shownGate.allowed ? <p className="text-sm text-muted-foreground">{shownGate.reason}</p> : null}
      {blocked && f.status !== "live" ? (
        <p className="text-sm text-warning">
          Everything is paused — resume it in{" "}
          <Link href={emailTabHref("settings")} prefetch={false} className="rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Settings
          </Link>{" "}
          before turning a flow on.
        </p>
      ) : null}
      {actions.error ? <p role="alert" className="text-sm text-destructive">{actions.error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Journey" className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-baseline gap-2">
            <h2 className="text-base font-semibold">Journey</h2>
            {f.steps.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {messages.length} message{messages.length === 1 ? "" : "s"} over {delayLabel(journeyHours(f.steps))}
              </span>
            ) : null}
          </div>
          {f.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not built yet. &ldquo;Build it as a draft&rdquo; writes the journey in {provider.name} — nothing sends until you turn it on. {provider.name} allows about 100 new flows a day, so big builds are queued.
            </p>
          ) : (
            <FlowJourney steps={f.steps} onOpen={setOpen} />
          )}
        </section>
        <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
            <dt className="text-muted-foreground">Recipients · 30d</dt>
            <dd className="text-right tabular-nums">{formatNumber(f.recipients30d)}</dd>
            <dt className="text-muted-foreground">Attributed · 30d</dt>
            <dd className="text-right tabular-nums">{formatMoney(f.revenue30d)}</dd>
            <dt className="text-muted-foreground">Caused · 30d</dt>
            <dd className="text-right tabular-nums">{f.incremental30d ? formatMoney(f.incremental30d) : "—"}</dd>
            <dt className="text-muted-foreground">Per recipient</dt>
            <dd className="text-right tabular-nums">{f.rpr ? formatMoney(f.rpr) : "—"}</dd>
          </dl>
          {f.edge ? <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Our edge:</span> {f.edge}</p> : null}
          {f.key ? (
          <div className="space-y-1.5 border-t border-border pt-3">
            <p className="text-xs font-medium">Autonomy for this flow</p>
            <Select
              value={level}
              disabled={!autonomyGate.allowed}
              onValueChange={(value) => void actions.run("autonomy", () => setProgramAutonomy(f.key as string, value === "inherit" ? null : (value as AutonomyLevel)))}
            >
              <SelectTrigger className="w-full" aria-label="Autonomy for this flow">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">Same as the employee ({AUTONOMY[w.autonomy].label})</SelectItem>
                {AUTONOMY_ORDER.map((a) => (
                  <SelectItem key={a} value={a}>{AUTONOMY[a].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">{AUTONOMY[effective].detail}</p>
            {!autonomyGate.allowed ? <p className="text-[11px] text-muted-foreground">{autonomyGate.reason}</p> : null}
          </div>
          ) : null}
        </aside>
      </div>
      {open ? (
        <FlowMessageDialog
          key={open.id}
          message={open}
          catalog={c.catalog}
          voice={c.voice}
          fromName={w.sender.fromName}
          advice={c.adviceBlock}
          busy={actions.busy !== null || !buildGate.allowed}
          onClose={() => setOpen(null)}
          onSave={(subject, previewText) => void actions.run("message", () => saveFlowMessage(f.id, open.id, subject, previewText)).then(() => setOpen(null))}
        />
      ) : null}
    </main>
  );
}
