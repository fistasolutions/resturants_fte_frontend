"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpenCheck, CircleHelp, TriangleAlert } from "lucide-react";

import { Panel, PanelRow } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ListSkeleton } from "@/features/customer-support/skeletons";
import { ActionFeedback, EmptyNote } from "@/features/customer-support/support-ui";
import { useSupportActions } from "@/features/customer-support/use-support-actions";
import { useApiQuery } from "@/hooks/use-api-query";
import { topicLabel } from "@/lib/customer-support";
import { can } from "@/lib/helpdesk-providers";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { relativeTime } from "@/lib/system-trace";
import { cn } from "@/lib/utils";
import { answerGap } from "@/services/customer-support-actions";
import type { KnowledgeGap, KnowledgeItem } from "@/types/customer-support";

const AREA_LABELS: Record<KnowledgeItem["area"], string> = {
  shipping: "Shipping",
  returns: "Returns",
  warranty: "Warranty",
  sizing: "Sizing",
  orders: "Orders",
  products: "Products",
};

const KIND_LABELS: Record<KnowledgeItem["kind"], string> = { policy: "Policy", fact: "Fact", article: "Help article", macro: "Macro" };

function ItemRow({ item, byId, now }: { item: KnowledgeItem; byId: Map<string, KnowledgeItem>; now: Date }) {
  const other = item.conflictWith ? byId.get(item.conflictWith) : null;
  return (
    <PanelRow
      trailing={
        <span className="flex flex-col items-end gap-1">
          {item.status === "conflict" ? <StatusBadge tone="destructive">Conflict</StatusBadge> : item.status === "stale" ? <StatusBadge tone="warning">Stale</StatusBadge> : null}
          <span className="text-[11px] tabular-nums text-muted-foreground">{item.used7d} uses · 7d</span>
        </span>
      }
    >
      <p className="text-sm font-medium text-foreground">
        {item.title} <span className="text-xs font-normal text-muted-foreground">· {KIND_LABELS[item.kind]}</span>
      </p>
      <p className="text-sm text-muted-foreground">{item.body}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {item.source.href ? (
          <Link href={item.source.href} prefetch={false} className="underline-offset-4 hover:text-foreground hover:underline">
            {item.source.system} · {item.source.label}
          </Link>
        ) : (
          <span>
            {item.source.system} · {item.source.label}
          </span>
        )}{" "}
        · checked {relativeTime(item.checkedAt, now)}
      </p>
      {other ? (
        <p className="mt-1 text-xs text-destructive">
          Says something different from “{other.title}” ({other.source.system}): “{other.body}”
        </p>
      ) : null}
    </PanelRow>
  );
}

function GapRow({ gap, macros, busy, onAnswer }: { gap: KnowledgeGap; macros: boolean; busy: boolean; onAnswer: (target: "fact" | "macro", text: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [target, setTarget] = useState<"fact" | "macro">("fact");
  const now = new Date();
  return (
    <PanelRow
      trailing={
        gap.answer ? (
          <StatusBadge tone="info">Pending approval</StatusBadge>
        ) : (
          <RoleGate need="team_performance.manage">
            <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              Add an answer
            </Button>
          </RoleGate>
        )
      }
    >
      <p className="text-sm font-medium text-foreground">{gap.question}</p>
      <p className="text-[11px] text-muted-foreground">
        Asked {gap.asked} {gap.asked === 1 ? "time" : "times"} · last {relativeTime(gap.lastAskedAt, now)} · {topicLabel(gap.topic)}
      </p>
      {gap.answer ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Proposed as a {gap.answer.target === "fact" ? "Brand Brain fact" : "macro"}: “{gap.answer.text}”
        </p>
      ) : null}
      {open && !gap.answer ? (
        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onAnswer(target, text).then((ok) => {
              if (ok) {
                setOpen(false);
                setText("");
              }
            });
          }}
        >
          <fieldset className="flex flex-wrap gap-3 text-xs">
            <legend className="sr-only">Save the answer as</legend>
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" name={`target-${gap.id}`} checked={target === "fact"} onChange={() => setTarget("fact")} />
              A Brand Brain fact (every writer uses it)
            </label>
            {macros ? (
              <label className="inline-flex items-center gap-1.5">
                <input type="radio" name={`target-${gap.id}`} checked={target === "macro"} onChange={() => setTarget("macro")} />
                A helpdesk macro
              </label>
            ) : null}
          </fieldset>
          <Textarea aria-label={`Answer: ${gap.question}`} value={text} onChange={(event) => setText(event.target.value)} rows={3} />
          <div className="flex items-center gap-2">
            <RoleButton need="team_performance.manage" type="submit" size="sm" disabled={text.trim().length < 10 || busy}>
              Propose
            </RoleButton>
            <span className="text-[11px] text-muted-foreground">Approve-first: it is used only after it is approved.</span>
          </div>
        </form>
      ) : null}
    </PanelRow>
  );
}

/**
 * Knowledge (SPEC-346): what the agent may say and where each answer came from — Brand Brain
 * facts and policies, help articles and macros — with stale and conflicting answers first, the
 * questions it could not answer, and the helpdesk's own rules so ours never fight them.
 */
export function KnowledgeTab() {
  const knowledge = useApiQuery(customerSupportQueries.knowledge());
  const workspace = useApiQuery(customerSupportQueries.workspace());
  const actions = useSupportActions();
  const [area, setArea] = useState<KnowledgeItem["area"] | "all">("all");

  if (knowledge.isPending || workspace.isPending) return <ListSkeleton />;
  if (knowledge.isError) return <QueryErrorState error={knowledge.error} onRetry={() => void knowledge.refetch()} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;

  const { items, gaps, rules } = knowledge.data;
  const provider = workspace.data.provider;
  const now = new Date();
  const byId = new Map(items.map((item) => [item.id, item]));
  const flagged = items.filter((item) => item.status !== "ok");
  const areas = [...new Set(items.map((item) => item.area))];
  const shown = items.filter((item) => item.status === "ok" && (area === "all" || item.area === area));

  return (
    <div className="space-y-4">
      <ActionFeedback
        notice={actions.notice}
        error={actions.error}
        onDismiss={() => {
          actions.clearError();
          actions.clearNotice();
        }}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Stale or conflicting" count={String(flagged.length)}>
          {flagged.length === 0 ? (
            <EmptyNote icon={BookOpenCheck} title="Every answer agrees and is current" />
          ) : (
            flagged.map((item) => <ItemRow key={item.id} item={item} byId={byId} now={now} />)
          )}
        </Panel>
        <Panel title="Questions it could not answer" count={String(gaps.length)}>
          {gaps.length === 0 ? (
            <EmptyNote icon={CircleHelp} title="No gaps this week" />
          ) : (
            gaps.map((gap) => (
              <GapRow
                key={gap.id}
                gap={gap}
                macros={can(provider, "macros")}
                busy={actions.busy !== null}
                onAnswer={(target, text) => actions.run(`gap-${gap.id}`, () => answerGap(gap.id, target, text))}
              />
            ))
          )}
        </Panel>
      </div>

      <Panel
        title="What it may say"
        count={String(shown.length)}
        aside={
          <nav aria-label="Areas" className="flex flex-wrap gap-1">
            {(["all", ...areas] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={area === key}
                onClick={() => setArea(key)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  area === key ? "border-foreground bg-foreground text-background" : "border-border hover:text-foreground",
                )}
              >
                {key === "all" ? "All" : AREA_LABELS[key]}
              </button>
            ))}
          </nav>
        }
      >
        {shown.length === 0 ? <EmptyNote icon={BookOpenCheck} title="Nothing in this area" /> : shown.map((item) => <ItemRow key={item.id} item={item} byId={byId} now={now} />)}
      </Panel>

      {can(provider, "rulesRead") ? (
        <Panel title="Your helpdesk's own rules" count={String(rules.length)} aside={<span>Read-only — so ours never fight them</span>}>
          {rules.map((rule) => (
            <PanelRow key={rule.id} leading={rule.conflict ? <TriangleAlert className="size-4 text-warning" aria-label="Conflicts with the agent" /> : undefined}>
              <p className="text-sm font-medium text-foreground">{rule.name}</p>
              <p className="text-sm text-muted-foreground">{rule.effect}</p>
              {rule.conflict ? <p className="mt-1 text-xs text-warning">{rule.conflict}</p> : null}
            </PanelRow>
          ))}
        </Panel>
      ) : null}
    </div>
  );
}
