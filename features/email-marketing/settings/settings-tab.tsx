"use client";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ActivityList } from "@/features/email-marketing/activity-list";
import { AutonomyCard } from "@/features/email-marketing/settings/autonomy-card";
import { ConnectionCard } from "@/features/email-marketing/settings/connection-card";
import { GuardrailsCard } from "@/features/email-marketing/settings/guardrails-card";
import { PausedNotice } from "@/features/email-marketing/settings/paused-notice";
import { SenderCard } from "@/features/email-marketing/settings/sender-card";
import { ListSkeleton } from "@/features/email-marketing/skeletons";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";

/** Settings (SPEC-345): a Resume line only while paused (SPEC-375), then
 * the connection, autonomy, guardrails, sender and seed list, and the activity log of everything
 * the employee and the owner did. */
export function SettingsTab() {
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  const audiences = useApiQuery(emailMarketingQueries.audiences());
  const activity = useApiQuery(emailMarketingQueries.activity());
  if (workspace.isPending) return <ListSkeleton rows={5} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;
  const w = workspace.data;
  const connected = w.connection.status === "connected";
  return (
    <div className="space-y-4">
      <PausedNotice workspace={w} />
      <ConnectionCard workspace={w} />
      {connected ? (
        <>
          <AutonomyCard level={w.autonomy} overrides={w.programAutonomy} />
          {audiences.data ? <GuardrailsCard key={JSON.stringify(w.guardrails)} guardrails={w.guardrails} audiences={audiences.data} /> : null}
          <SenderCard key={JSON.stringify([w.sender, w.guardrails.seedList])} sender={w.sender} guardrails={w.guardrails} />
        </>
      ) : null}
      <SettingsPanel title="Activity" description="Every action, by whom or what, and what changed in the email platform.">
        {activity.isPending ? <ListSkeleton rows={3} /> : activity.isError ? <QueryErrorState error={activity.error} onRetry={() => void activity.refetch()} /> : <ActivityList entries={activity.data} now={new Date()} />}
      </SettingsPanel>
    </div>
  );
}
