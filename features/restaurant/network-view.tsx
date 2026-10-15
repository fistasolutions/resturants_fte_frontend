"use client";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { AccessTab } from "@/features/restaurant/access-tab";
import { BranchesTab } from "@/features/restaurant/branches-tab";
import { BrandSettingsTab } from "@/features/restaurant/brand-settings-tab";
import { DataTab } from "@/features/restaurant/data-tab";
import { FranchiseesTab } from "@/features/restaurant/franchisees-tab";
import { OverviewTab } from "@/features/restaurant/overview-tab";
import { EmptyPanel, RestaurantSkeleton } from "@/features/restaurant/parts";
import { RegionsTab } from "@/features/restaurant/regions-tab";
import { SetupCard } from "@/features/restaurant/setup-card";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { HQ_TABS, type NetworkTab } from "@/lib/restaurant";
import type { RestaurantFilters } from "@/types/restaurant";

/** `/network`'s content (SPEC-377): the setup card until the brand exists, then the tab. */
export function NetworkView({ tab, filters }: { tab: NetworkTab; filters: RestaurantFilters }) {
  const setup = useApiQuery(restaurantQueries.setup());
  if (setup.isError) return <QueryErrorState error={setup.error} onRetry={() => void setup.refetch()} />;
  if (!setup.data) return <RestaurantSkeleton />;
  if (!setup.data.ready) {
    return setup.data.scope.isHq ? (
      <SetupCard />
    ) : (
      <EmptyPanel title="Your brand is not set up yet" body="Head office sets the brand up; your branches appear here once it has." />
    );
  }
  if (HQ_TABS.has(tab) && !setup.data.scope.isHq) {
    return <EmptyPanel title="Head office only" body="This part of the network is managed by the brand's head office." />;
  }
  switch (tab) {
    case "branches":
      return <BranchesTab filters={filters} />;
    case "franchisees":
      return <FranchiseesTab />;
    case "regions":
      return <RegionsTab />;
    case "access":
      return <AccessTab />;
    case "data":
      return <DataTab />;
    case "settings":
      return <BrandSettingsTab />;
    default:
      return <OverviewTab filters={filters} />;
  }
}
