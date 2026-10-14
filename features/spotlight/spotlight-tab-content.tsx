"use client";

import { ApprovalsTab } from "@/features/spotlight/approvals-tab";
import { DailyPicksTab } from "@/features/spotlight/daily-picks-tab";
import { SpotlightChatTab } from "@/features/spotlight/employee-chat/spotlight-chat-tab";
import { InboundAdvanced } from "@/features/spotlight/inbound-advanced";
import { InboundEngineTab } from "@/features/spotlight/inbound-engine-tab";
import { MoneyPagesView } from "@/features/money-pages/money-pages-view";
import { OverviewTab } from "@/features/spotlight/overview-tab";
import { PublishedTab } from "@/features/spotlight/published-tab";
import { SpotlightContentSkeleton } from "@/features/spotlight/spotlight-content-skeleton";
import { VisibilityTab } from "@/features/spotlight/visibility-tab";
import { useApiQuery } from "@/hooks/use-api-query";
import { clarityQueries } from "@/lib/queries/clarity";
import { moneyPageQueries } from "@/lib/queries/money-pages";
import { spotlightQueries } from "@/lib/queries/spotlight";
import type { SpotlightTab } from "@/lib/spotlight";
import type { ClarityBlogPost } from "@/types/clarity";

function Failed() {
  return (
    <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
      We couldn&apos;t load Search Visibility right now. Please retry in a moment.
    </div>
  );
}

/**
 * The active Spotlight tab, read from the client cache (SPEC-230). Each tab observes
 * only its own queries; the header + tab bar are the persistent spotlight shell.
 * Daily Picks keeps its card mounted across a day change (SPEC-163 Patch): the
 * past-day snapshot is a separate query layered over today's, so only the list
 * below updates. The Published tab's three enrichments stay best-effort — a Search
 * Console, attribution or Clarity hiccup must never take the tab down.
 */
export function SpotlightTabContent({ activeTab, date }: { activeTab: SpotlightTab; date?: string }) {
  const overview = useApiQuery(activeTab === "overview" ? spotlightQueries.overview() : null);
  const inbound = useApiQuery(activeTab === "inbound" ? spotlightQueries.inboundTopics() : null);
  const isPicks = activeTab === "daily-picks";
  const today = useApiQuery(isPicks ? spotlightQueries.dailyPicks() : null);
  const history = useApiQuery(isPicks ? spotlightQueries.dailyPicksHistory() : null);
  const drafts = useApiQuery(isPicks ? spotlightQueries.drafts() : null);
  const wantsPast = isPicks && !!date && !!today.data && date !== today.data.pickDate;
  const past = useApiQuery(wantsPast && date ? spotlightQueries.dailyPicksForDate(date) : null);
  const approvals = useApiQuery(activeTab === "approvals" ? spotlightQueries.approvals() : null);
  const isPublished = activeTab === "published";
  const published = useApiQuery(isPublished ? spotlightQueries.published() : null);
  const unpublished = useApiQuery(isPublished ? spotlightQueries.unpublished() : null);
  const reachSource = useApiQuery(isPublished ? spotlightQueries.visibility() : null);
  const coverage = useApiQuery(isPublished ? spotlightQueries.journeyCoverage() : null);
  const engagementSource = useApiQuery(isPublished ? clarityQueries.blogEngagement() : null);
  const refresh = useApiQuery(isPublished ? spotlightQueries.refresh() : null);
  const visibility = useApiQuery(activeTab === "visibility" ? spotlightQueries.visibility() : null);
  const money = useApiQuery(activeTab === "money-pages" ? moneyPageQueries.list() : null);

  // Brand Brain is its own route since SPEC-263 (`/spotlight/brand-brain/*`); the
  // page redirects `?tab=brand-brain` there, so it never renders here.
  // The employee's chat (SPEC-293) owns its own reads through `useEmployeeChat`.
  if (activeTab === "chat") return <SpotlightChatTab />;
  if (activeTab === "inbound") {
    if (inbound.isPending) return <SpotlightContentSkeleton />;
    if (inbound.isError) return <Failed />;
    return (
      <div className="space-y-6">
        <InboundEngineTab data={inbound.data} />
        <InboundAdvanced />
      </div>
    );
  }
  if (isPicks) {
    if (today.isPending || history.isPending || drafts.isPending) return <SpotlightContentSkeleton />;
    if (today.isError || history.isError || drafts.isError) return <Failed />;
    // A past date loads on top only when explicitly requested; a missing snapshot
    // (null) falls back to today, exactly as before.
    const snapshot = wantsPast && past.data ? past.data : today.data;
    return (
      <DailyPicksTab
        snapshot={snapshot}
        history={history.data}
        todayDate={today.data.pickDate}
        drafts={drafts.data}
      />
    );
  }
  if (activeTab === "approvals") {
    if (approvals.isPending) return <SpotlightContentSkeleton />;
    if (approvals.isError) return <Failed />;
    return <ApprovalsTab drafts={approvals.data} />;
  }
  if (isPublished) {
    // Wait for all of them so the enrichments paint with the posts (as the server did),
    // but only the posts themselves can fail the tab.
    if (published.isPending || unpublished.isPending || reachSource.isPending || coverage.isPending || engagementSource.isPending || refresh.isPending) {
      return <SpotlightContentSkeleton />;
    }
    if (published.isError) return <Failed />;
    const reach: Record<number, number> = reachSource.isSuccess
      ? Object.fromEntries(
          reachSource.data.posts
            .filter((post) => !post.estimated && post.impressions > 0)
            .map((post) => [post.draftId, post.impressions]),
        )
      : {};
    const engagement: Record<number, ClarityBlogPost> = engagementSource.isSuccess
      ? Object.fromEntries(engagementSource.data.posts.filter((p) => p.measured).map((p) => [p.draftId, p]))
      : {};
    return (
      <PublishedTab
        posts={published.data}
        unpublished={unpublished.isSuccess ? unpublished.data : []}
        reach={reach}
        coverage={coverage.isSuccess ? coverage.data : null}
        engagement={engagement}
        refresh={refresh.isSuccess ? refresh.data : null}
      />
    );
  }
  if (activeTab === "money-pages") {
    if (money.isPending) return <SpotlightContentSkeleton />;
    if (money.isError) return <Failed />;
    return <MoneyPagesView data={money.data} />;
  }
  if (activeTab === "visibility") {
    if (visibility.isPending) return <SpotlightContentSkeleton />;
    if (visibility.isError) return <Failed />;
    return <VisibilityTab data={visibility.data} />;
  }
  if (overview.isPending) return <SpotlightContentSkeleton />;
  if (overview.isError) return <Failed />;
  return <OverviewTab data={overview.data} />;
}
