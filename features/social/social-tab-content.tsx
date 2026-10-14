"use client";

import { ApprovalsTab } from "@/features/social/approvals-tab";
import { CalendarTab } from "@/features/social/calendar-tab";
import { ContentStudioTab } from "@/features/social/content-studio-tab";
import { OverviewTab } from "@/features/social/overview-tab";
import { PerformanceTab } from "@/features/social/performance-tab";
import { SocialContentSkeleton } from "@/features/social/social-content-skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import type { SocialTab } from "@/lib/social";
import { socialQueries } from "@/lib/queries/social";

/**
 * The active Social Growth tab, read from the client cache (SPEC-230). Each tab
 * observes only its own query; the header + tab bar are the persistent social shell.
 */
export function SocialTabContent({ activeTab }: { activeTab: SocialTab }) {
  const overview = useApiQuery(activeTab === "overview" ? socialQueries.overview() : null);
  const studio = useApiQuery(activeTab === "content-studio" ? socialQueries.studioProducts() : null);
  const calendar = useApiQuery(activeTab === "calendar" ? socialQueries.calendar() : null);
  const approvals = useApiQuery(activeTab === "approvals" ? socialQueries.approvals() : null);
  const performance = useApiQuery(activeTab === "performance" ? socialQueries.performance() : null);

  const active =
    activeTab === "content-studio"
      ? studio
      : activeTab === "calendar"
        ? calendar
        : activeTab === "approvals"
          ? approvals
          : activeTab === "performance"
            ? performance
            : overview;

  if (active.isPending) return <SocialContentSkeleton />;
  if (active.isError) {
    return (
      <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
        We couldn&apos;t load Social Media Manager right now. Please retry in a moment.
      </div>
    );
  }

  if (studio.isSuccess) return <ContentStudioTab key="studio" initial={studio.data} />;
  if (calendar.isSuccess) return <CalendarTab data={calendar.data} />;
  if (approvals.isSuccess) return <ApprovalsTab data={approvals.data} />;
  if (performance.isSuccess) return <PerformanceTab data={performance.data} />;
  if (overview.isSuccess) return <OverviewTab data={overview.data} />;
  return <SocialContentSkeleton />;
}
