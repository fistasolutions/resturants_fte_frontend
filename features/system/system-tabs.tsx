"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { SYSTEM_TABS, activeSystemTab, systemTabHref } from "@/lib/system-tabs";

/** System tab bar (SPEC-229). Lives in the persistent layout so it stays mounted
 * across switches — the active underline moves instantly on click (`usePathname`),
 * before the new tab's data loads. Active filters are read from the URL and carried
 * onto every tab link. Mirrors `TrafficTabs`. */
export function SystemTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeSystemTab(pathname);

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/system", SYSTEM_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="System sections">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={systemTabHref(tab.basePath, searchParams)}
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
