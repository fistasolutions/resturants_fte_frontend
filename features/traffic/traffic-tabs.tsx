"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { TRAFFIC_TABS, activeTrafficTab, trafficTabHref } from "@/lib/traffic-tabs";

/** Store Traffic tab bar (SPEC-112). Lives in the persistent traffic layout so
 * it stays mounted across switches — the active underline moves instantly on
 * click (`usePathname`), before the new tab's data loads. The date range is
 * read from the URL and carried onto every tab link. */
export function TrafficTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeTrafficTab(pathname);

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/traffic", TRAFFIC_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="Store traffic sections">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={trafficTabHref(tab.basePath, searchParams)}
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
