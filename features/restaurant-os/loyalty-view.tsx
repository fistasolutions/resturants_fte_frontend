"use client";

import { GiftCardsTab } from "@/features/restaurant-os/gift-cards-tab";
import { LoyaltyMembersTab } from "@/features/restaurant-os/loyalty-members-tab";
import { LoyaltyProgramTab } from "@/features/restaurant-os/loyalty-program-tab";
import { SettlementTab } from "@/features/restaurant-os/settlement-tab";
import { EmptyPanel } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import type { LoyaltyTab } from "@/lib/loyalty";
import { restaurantQueries } from "@/lib/queries/restaurant";

/** Loyalty & Gift Cards (SPEC-383 over backend SPEC-398). */
export function LoyaltyView({ tab }: { tab: LoyaltyTab }) {
  const setup = useApiQuery(restaurantQueries.setup());
  const isHq = setup.data?.scope.isHq ?? false;
  if (tab === "members") return <LoyaltyMembersTab />;
  if (tab === "gift-cards") return <GiftCardsTab />;
  if (tab === "settlement") {
    return isHq ? <SettlementTab /> : <EmptyPanel title="Head office only" body="The settlement between franchises is head office's to read." />;
  }
  return <LoyaltyProgramTab isHq={isHq} />;
}
