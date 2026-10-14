"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { GorgiasTabs } from "@/features/team-performance/gorgias-tabs";
import { resolveDateRange } from "@/lib/date-range";
import {
  activeGorgiasTab,
  withWorkspaceDefaultRange,
  type GorgiasTab,
} from "@/lib/gorgias-tabs";

const TAB_DESCRIPTION: Record<GorgiasTab, string> = {
  overview:
    "Support health at a glance — volume, response speed, resolution, and backlog, versus the previous period.",
  conversations:
    "Every conversation, searchable and filterable — who replied, how fast, and what it was about. Read-only from Gorgias.",
  agents: "Per-agent performance — click an agent to see their conversations and replies.",
  alerts: "Conversations that need attention — unanswered, unhappy, reopened, or open over 24 hours.",
  voice:
    "What customers keep asking about — demand and pain themes mined from support conversations. Aggregated themes only, no personal data.",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Persistent Gorgias workspace shell (SPEC-094), rendered from the
 * `team-performance` layout so header + date picker + tab bar stay mounted
 * across tab switches — only `{children}` (the active tab's body) swaps. On a
 * detail route (`/conversations/[id]`, `/agents/[id]`) `activeGorgiasTab` is
 * null and it renders `{children}` bare — those pages own their header +
 * breadcrumb.
 */
export function GorgiasShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeGorgiasTab(pathname);

  if (!active) return <>{children}</>;

  const range = resolveDateRange(
    withWorkspaceDefaultRange(Object.fromEntries(searchParams.entries())),
    todayISO(),
  );

  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Team Performance"
        description={TAB_DESCRIPTION[active]}
        actions={
          <DateRangePicker
            from={range.from}
            to={range.to}
            preset={range.preset}
            label={range.label}
            basePath={pathname}
          />
        }
      />

      <div>
        <GorgiasTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
