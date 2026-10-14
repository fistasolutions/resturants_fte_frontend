"use client";

import { useSearchParams } from "next/navigation";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ApprovalsTab } from "@/features/email-marketing/approvals/approvals-tab";
import { AudiencesTab } from "@/features/email-marketing/audiences/audiences-tab";
import { CampaignsTab } from "@/features/email-marketing/campaigns/campaigns-tab";
import { EmailChatTab } from "@/features/email-marketing/chat/email-chat-tab";
import { ContentTab } from "@/features/email-marketing/content/content-tab";
import { DeliverabilityTab } from "@/features/email-marketing/deliverability/deliverability-tab";
import { FlowsTab } from "@/features/email-marketing/flows/flows-tab";
import { NotConnected } from "@/features/email-marketing/not-connected";
import { OverviewTab } from "@/features/email-marketing/overview/overview-tab";
import { PerformanceTab } from "@/features/email-marketing/performance/performance-tab";
import { PlanTab } from "@/features/email-marketing/plan/plan-tab";
import { SettingsTab } from "@/features/email-marketing/settings/settings-tab";
import { TabSkeleton } from "@/features/email-marketing/skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { EMAIL_TAB_LABELS, normalizeEmailTab, type EmailTab } from "@/lib/email-marketing";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";

function TabBody({ tab }: { tab: EmailTab }) {
  switch (tab) {
    case "overview":
      return <OverviewTab />;
    case "plan":
      return <PlanTab />;
    case "campaigns":
      return <CampaignsTab />;
    case "flows":
      return <FlowsTab />;
    case "audiences":
      return <AudiencesTab />;
    case "content":
      return <ContentTab />;
    case "approvals":
      return <ApprovalsTab />;
    case "performance":
      return <PerformanceTab />;
    case "deliverability":
      return <DeliverabilityTab />;
    case "chat":
      return <EmailChatTab />;
    case "settings":
      return <SettingsTab />;
  }
}

/**
 * The open tab (SPEC-345), from `?tab=` — read in the browser so a switch never asks the
 * server. Every tab but Settings needs a connected platform; without one it says so and
 * points to Settings → Connection.
 */
export function EmailMarketingView() {
  const params = useSearchParams();
  const tab = normalizeEmailTab(params.get("tab"));
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  if (tab === "settings") return <SettingsTab />;
  if (workspace.isPending) return <TabSkeleton />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;
  if (workspace.data.connection.status === "not_connected") return <NotConnected what={EMAIL_TAB_LABELS[tab]} />;
  return <TabBody tab={tab} />;
}
