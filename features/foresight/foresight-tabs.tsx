"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { FORESIGHT_TABS, activeForesightTab, foresightTabHref } from "@/lib/foresight-tabs";

/** Foresight tab bar (SPEC-152). Lives in the persistent layout so it stays mounted
 * across switches — the active underline moves instantly (`usePathname`) and the date
 * range is carried onto every tab link. */
export function ForesightTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeForesightTab(pathname);

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/foresight", FORESIGHT_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="Foresight sections">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={foresightTabHref(tab.basePath, searchParams)}
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
