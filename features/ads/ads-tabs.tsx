"use client";

import Link from "next/link";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";

import { ADS_TAB_IDS, ADS_TAB_LABELS, type AdsTab } from "@/lib/ads";

/** URL-driven server tabs — real anchors (keyboard-navigable, shareable,
 * back-button friendly), mirroring the Spotlight / Social pattern. Active
 * underline uses `bg-primary`. */
export function AdsTabs({ active }: { active: AdsTab }) {
  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/ads", ADS_TAB_IDS, (tab) => tab, active);
  return (
    <FolderTabBar role="tablist" label="Paid Ads Manager sections">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <Link
            key={tab}
            href={`/ads?tab=${tab}`}
            role="tab"
            aria-selected={selected}
            {...folderTab(selected)}
          >
            {ADS_TAB_LABELS[tab]}
          </Link>
        );
      })}
    </FolderTabBar>
  );
}
