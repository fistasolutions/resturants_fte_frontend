"use client";

import { useSearchParams } from "next/navigation";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CardsSkeleton } from "@/features/customer-support/skeletons";
import { ActionFeedback } from "@/features/customer-support/support-ui";
import { PlaybookEditor } from "@/features/customer-support/topics/playbook-editor";
import { TestBench } from "@/features/customer-support/topics/test-bench";
import { TopicCard } from "@/features/customer-support/topics/topic-card";
import { useSupportActions } from "@/features/customer-support/use-support-actions";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { TOPIC_ORDER, supportHref, topicLabel } from "@/lib/customer-support";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { savePlaybook, setTopic } from "@/services/customer-support-actions";
import type { TopicKey } from "@/types/customer-support";

function isTopic(value: string | null): value is TopicKey {
  return value !== null && (TOPIC_ORDER as string[]).includes(value);
}

/**
 * Topics & playbooks (SPEC-346): how the agent handles each kind of ticket. A card per topic;
 * `?topic=` opens its playbook and the test bench in a side sheet, so the list stays put.
 */
export function TopicsTab() {
  const params = useSearchParams();
  const open = params.get("topic");
  const topics = useApiQuery(customerSupportQueries.topics());
  const workspace = useApiQuery(customerSupportQueries.workspace());
  const actions = useSupportActions();
  const can = useCan();
  // A topic's autonomy decides what reaches customers (both); a playbook is the queue's own setting.
  const topicGate = can(["messages.send", "team_performance.manage"]);
  const playbookGate = can("team_performance.manage");

  if (topics.isPending || workspace.isPending) return <CardsSkeleton count={6} />;
  if (topics.isError) return <QueryErrorState error={topics.error} onRetry={() => void topics.refetch()} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;

  const data = topics.data;
  const w = workspace.data;
  // A topic the store does not have (size and fit on a store that sells no clothing, backend
  // SPEC-373) opens nothing, even from a hand-typed link.
  const sheetTopic = isTopic(open) && data.playbooks[open] ? open : null;
  const ordered = [...data.topics].sort((a, b) => b.volume7d - a.volume7d || TOPIC_ORDER.indexOf(a.key) - TOPIC_ORDER.indexOf(b.key));
  const close = () => window.history.pushState(null, "", supportHref("topics"));

  return (
    <div className="space-y-3">
      <ActionFeedback
        notice={actions.notice}
        error={actions.error}
        onDismiss={() => {
          actions.clearError();
          actions.clearNotice();
        }}
      />
      <p className="text-sm text-muted-foreground">Busiest first. Each topic follows the agent’s autonomy unless you set its own.</p>
      {topicGate.allowed ? null : <p className="text-xs text-muted-foreground">{topicGate.reason}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((topic) => (
          <TopicCard
            key={topic.key}
            topic={topic}
            workspace={w}
            busy={actions.busy !== null || !topicGate.allowed}
            onAutonomy={(level) => void actions.run(`autonomy-${topic.key}`, () => setTopic(topic.key, { autonomy: level }))}
            onBulkSafe={(value) => void actions.run(`bulk-${topic.key}`, () => setTopic(topic.key, { bulkSafe: value }))}
          />
        ))}
      </div>
      <Sheet open={sheetTopic !== null} onOpenChange={(next) => (next ? undefined : close())}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
          {sheetTopic !== null ? (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{topicLabel(sheetTopic)} — playbook</SheetTitle>
                <SheetDescription>How the agent handles this kind of ticket. Test it on a real past ticket below before you rely on it.</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 p-4">
                {playbookGate.allowed ? null : <p className="text-xs text-muted-foreground">{playbookGate.reason}</p>}
                <fieldset disabled={!playbookGate.allowed} className="min-w-0">
                  <PlaybookEditor
                    key={`${sheetTopic}:${data.playbooks[sheetTopic].updatedAt}`}
                    playbook={data.playbooks[sheetTopic]}
                    busy={actions.busy === `playbook-${sheetTopic}`}
                    onSave={(draft) => void actions.run(`playbook-${sheetTopic}`, () => savePlaybook(sheetTopic, draft))}
                  />
                </fieldset>
                <ActionFeedback
                  notice={actions.notice}
                  error={actions.error}
                  onDismiss={() => {
                    actions.clearError();
                    actions.clearNotice();
                  }}
                />
                <section className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold">Test bench</h3>
                  <TestBench topic={sheetTopic} tickets={data.benchTickets[sheetTopic] ?? []} workspace={w} />
                </section>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
