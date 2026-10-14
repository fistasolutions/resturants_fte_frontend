"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { GORGIAS_TABS, activeGorgiasTab, gorgiasTabHref } from "@/lib/gorgias-tabs";

/**
 * Gorgias workspace tab bar (SPEC-094). Lives in the persistent layout, so it
 * stays mounted across tab switches — the active underline moves instantly on
 * click (`usePathname`), before the new tab's data loads. The selected date
 * range is carried onto every tab link (`gorgiasTabHref`) so it survives a
 * switch; conversation-only filters are intentionally not carried.
 */
export function GorgiasTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeGorgiasTab(pathname);

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/team-performance", GORGIAS_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="Team performance views">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={gorgiasTabHref(tab.basePath, searchParams)}
            aria-current={isActive ? "page" : undefined}
            {...folderTab(isActive)}
          >
            {tab.label}
          </Link>
        );
      })}
    </FolderTabBar>
  );
}
