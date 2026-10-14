"use client";

import { useSearchParams } from "next/navigation";

import { ApprovalsTab } from "@/features/customer-support/approvals/approvals-tab";
import { SupportChatTab } from "@/features/customer-support/chat-tab";
import { ConnectionGate } from "@/features/customer-support/connection-gate";
import { InboxTab } from "@/features/customer-support/inbox/inbox-tab";
import { InsightsTab } from "@/features/customer-support/insights-tab";
import { KnowledgeTab } from "@/features/customer-support/knowledge-tab";
import { OverviewTab } from "@/features/customer-support/overview-tab";
import { PerformanceTab } from "@/features/customer-support/performance/performance-tab";
import { SettingsTab } from "@/features/customer-support/settings/settings-tab";
import {
  CardsSkeleton,
  InboxSkeleton,
  ListSkeleton,
  OverviewSkeleton,
  PerformanceSkeleton,
} from "@/features/customer-support/skeletons";
import { TopicsTab } from "@/features/customer-support/topics/topics-tab";
import { normalizeSupportTab } from "@/lib/customer-support";

/**
 * The Customer Support Agent's content (SPEC-346): the tab the URL names. The header and tab
 * bar live in the persistent shell; tabs switch with `history.pushState`, so this re-renders in
 * place. Every tab but Settings sits behind the connection gate — Settings is where the
 * connection is made.
 */
export function CustomerSupportView() {
  const params = useSearchParams();
  const tab = normalizeSupportTab(params.get("tab"));
  switch (tab) {
    case "inbox":
      return (
        <ConnectionGate what="The Inbox" skeleton={<InboxSkeleton />}>
          <InboxTab />
        </ConnectionGate>
      );
    case "approvals":
      return (
        <ConnectionGate what="Every reply waiting for you" skeleton={<ListSkeleton />}>
          <ApprovalsTab />
        </ConnectionGate>
      );
    case "topics":
      return (
        <ConnectionGate what="Each topic's volume and playbook" skeleton={<CardsSkeleton count={6} />}>
          <TopicsTab />
        </ConnectionGate>
      );
    case "knowledge":
      return (
        <ConnectionGate what="What the agent may say" skeleton={<ListSkeleton />}>
          <KnowledgeTab />
        </ConnectionGate>
      );
    case "insights":
      return (
        <ConnectionGate what="Why customers write" skeleton={<CardsSkeleton count={4} />}>
          <InsightsTab />
        </ConnectionGate>
      );
    case "performance":
      return (
        <ConnectionGate what="How the agent performs" skeleton={<PerformanceSkeleton />}>
          <PerformanceTab />
        </ConnectionGate>
      );
    case "chat":
      return (
        <ConnectionGate what="What the agent can tell you" skeleton={<ListSkeleton rows={3} />}>
          <SupportChatTab />
        </ConnectionGate>
      );
    case "settings":
      return <SettingsTab />;
    default:
      return (
        <ConnectionGate what="The shift at a glance" skeleton={<OverviewSkeleton />}>
          <OverviewTab />
        </ConnectionGate>
      );
  }
}
