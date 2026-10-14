"use client";

import { AccountabilityTab } from "@/features/ads/accountability-tab";
import { AdsContentSkeleton } from "@/features/ads/ads-content-skeleton";
import { AuditTab } from "@/features/ads/audit/audit-tab";
import { CampaignsTab } from "@/features/ads/campaigns-tab";
import { CreativeTab } from "@/features/ads/creative-tab";
import { OverviewTab } from "@/features/ads/overview-tab";
import { SpendGatesTab } from "@/features/ads/spend-gates-tab";
import { useApiQuery } from "@/hooks/use-api-query";
import type { AdsTab } from "@/lib/ads";
import { adsQueries } from "@/lib/queries/ads";
import { clarityQueries } from "@/lib/queries/clarity";

/**
 * The active Performance Ads tab, read from the client cache (SPEC-230). Each tab
 * observes only its own query; Clarity's source behaviour is best-effort on the
 * Overview — it must render with or without it.
 */
export function AdsTabContent({ activeTab }: { activeTab: AdsTab }) {
  const isOverview = !["audit", "campaigns", "creative", "spend-gates", "accountability"].includes(activeTab);
  const overview = useApiQuery(isOverview ? adsQueries.overview() : null);
  const behaviour = useApiQuery(isOverview ? clarityQueries.campaigns() : null);
  const campaigns = useApiQuery(activeTab === "campaigns" ? adsQueries.campaigns() : null);
  const creative = useApiQuery(activeTab === "creative" ? adsQueries.creative() : null);
  const spendGates = useApiQuery(activeTab === "spend-gates" ? adsQueries.spendGates() : null);
  const accountability = useApiQuery(activeTab === "accountability" ? adsQueries.accountability() : null);

  const active = isOverview
    ? overview
    : activeTab === "campaigns"
      ? campaigns
      : activeTab === "creative"
        ? creative
        : activeTab === "spend-gates"
          ? spendGates
          : accountability;

  // SPEC-333: the Audit tab owns its reads (connection → figures → findings).
  if (activeTab === "audit") return <AuditTab />;
  if (active.isPending || (isOverview && behaviour.isPending)) return <AdsContentSkeleton />;
  if (active.isError) {
    return (
      <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
        We couldn&apos;t load Paid Ads Manager right now. Please retry in a moment.
      </div>
    );
  }

  if (campaigns.isSuccess) return <CampaignsTab data={campaigns.data} />;
  if (creative.isSuccess) return <CreativeTab data={creative.data} />;
  if (spendGates.isSuccess) return <SpendGatesTab data={spendGates.data} />;
  if (accountability.isSuccess) return <AccountabilityTab data={accountability.data} />;
  if (overview.isSuccess) {
    return <OverviewTab data={overview.data} behaviour={behaviour.data ?? undefined} />;
  }
  return <AdsContentSkeleton />;
}
