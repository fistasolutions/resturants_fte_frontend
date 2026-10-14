"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { REPORT_FTE_TABS, activeReportFteTab } from "@/lib/report-fte-tabs";

/**
 * Report FTE tab bar (SPEC-256). Lives in the persistent layout, so it stays mounted
 * across tab switches — the active underline moves instantly on click
 * (`usePathname`), before the new tab's data loads.
 */
export function ReportFteTabs() {
  const pathname = usePathname();
  const active = activeReportFteTab(pathname);

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/report-fte", REPORT_FTE_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="Report Builder sections">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.basePath}
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
