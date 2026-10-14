"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ActivityLog } from "@/features/customer-support/settings/activity-log";
import { AutonomyCard } from "@/features/customer-support/settings/autonomy-card";
import { ConnectionCard } from "@/features/customer-support/settings/connection-card";
import { GuardrailsCard } from "@/features/customer-support/settings/guardrails-card";
import { HandoffCard } from "@/features/customer-support/settings/handoff-card";
import { HoursCard } from "@/features/customer-support/settings/hours-card";
import { PausedNotice } from "@/features/customer-support/settings/paused-notice";
import { ListSkeleton } from "@/features/customer-support/skeletons";
import { ActionFeedback } from "@/features/customer-support/support-ui";
import { useSupportActions } from "@/features/customer-support/use-support-actions";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import type { RoleGateResult } from "@/lib/role-gate";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { saveSettings, setAutonomy } from "@/services/customer-support-actions";

const SECTIONS = [
  { id: "connection", title: "Connection", summary: "Your helpdesk — the same connection as on Integrations." },
  { id: "autonomy", title: "Autonomy", summary: "How far the agent may go without you." },
  { id: "guardrails", title: "Guardrails", summary: "What it never does, and when it hands a ticket to a person." },
  { id: "hours", title: "Hours & SLAs", summary: "When you answer, how long an order may wait to ship, and how fast on each channel." },
  { id: "handoff", title: "Hand-off map", summary: "Who receives each kind of ticket." },
  { id: "activity", title: "Activity log", summary: "Everything done in your helpdesk, by whom." },
] as const;

function Section({ id, title, summary, children }: { id: string; title: string; summary: string; children: React.ReactNode }) {
  return (
    <section id={`cs-${id}`} aria-labelledby={`cs-${id}-title`} className="scroll-mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
      <header>
        <h2 id={`cs-${id}-title`} className="text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </header>
      {children}
    </section>
  );
}

/** A card the member's role may not save reads as view-only, with the role's reason (SPEC-358). */
function RoleFieldset({ gate, children }: { gate: RoleGateResult; children: React.ReactNode }) {
  return (
    <>
      {gate.allowed ? null : <p className="text-xs text-muted-foreground">{gate.reason}</p>}
      <fieldset disabled={!gate.allowed} className="min-w-0">
        {children}
      </fieldset>
    </>
  );
}

/**
 * Settings (SPEC-346): a Resume line only while paused (SPEC-375),
 * connection, autonomy, guardrails, hours and SLAs, the hand-off map and the activity log — one
 * page with a section index, `?section=` scrolling to one. It is the one tab outside the
 * connection gate: it is where the connection is made, and where the switch must stay reachable.
 */
export function SettingsTab() {
  const params = useSearchParams();
  const section = params.get("section");
  const workspace = useApiQuery(customerSupportQueries.workspace());
  const actions = useSupportActions();
  const can = useCan();
  const autonomyGate = can(["messages.send", "team_performance.manage"]);
  const manageGate = can("team_performance.manage");

  useEffect(() => {
    if (!section || !workspace.isSuccess) return;
    document.getElementById(`cs-${section}`)?.scrollIntoView({ block: "start" });
  }, [section, workspace.isSuccess]);

  if (workspace.isPending) return <ListSkeleton />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;
  const w = workspace.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="hidden lg:block">
        <ul className="sticky top-4 space-y-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#cs-${s.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 space-y-4">
        <ActionFeedback
          notice={actions.notice}
          error={actions.error}
          onDismiss={() => {
            actions.clearError();
            actions.clearNotice();
          }}
        />
        <PausedNotice workspace={w} />
        <Section {...SECTIONS[0]}>
          <ConnectionCard />
        </Section>
        <Section {...SECTIONS[1]}>
          <RoleFieldset gate={autonomyGate}>
            <AutonomyCard workspace={w} busy={actions.busy === "autonomy"} onChange={(level) => void actions.run("autonomy", () => setAutonomy(level))} />
          </RoleFieldset>
        </Section>
        <Section {...SECTIONS[2]}>
          <RoleFieldset gate={manageGate}>
            <GuardrailsCard
              key={JSON.stringify(w.guardrails)}
              guardrails={w.guardrails}
              busy={actions.busy === "guardrails"}
              onSave={(guardrails) => void actions.run("guardrails", () => saveSettings({ guardrails }))}
            />
          </RoleFieldset>
        </Section>
        <Section {...SECTIONS[3]}>
          <RoleFieldset gate={manageGate}>
            <HoursCard
              key={JSON.stringify([w.hours, w.slas])}
              hours={w.hours}
              slas={w.slas}
              provider={w.provider}
              busy={actions.busy === "hours"}
              onSave={(hours, slas) => void actions.run("hours", () => saveSettings({ hours, slas }))}
            />
          </RoleFieldset>
        </Section>
        <Section {...SECTIONS[4]}>
          <RoleFieldset gate={manageGate}>
            <HandoffCard
              key={JSON.stringify(w.handoffMap)}
              workspace={w}
              busy={actions.busy === "handoff"}
              onSave={(handoffMap) => void actions.run("handoff", () => saveSettings({ handoffMap }))}
            />
          </RoleFieldset>
        </Section>
        <Section {...SECTIONS[5]}>
          <ActivityLog />
        </Section>
      </div>
    </div>
  );
}
