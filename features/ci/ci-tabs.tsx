"use client";

import Link from "next/link";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";

import { CI_TABS, type CiTab } from "@/lib/ci";

/**
 * The Reports | Plans bar of Continuous Innovation (SPEC-272). Static by
 * construction — no counts — so it lives in the shell and never re-paints.
 */
export function CiTabs({ active }: { active: CiTab }) {
  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/ci", CI_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar role="tablist" label="Continuous Innovation sections">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={selected}
            {...folderTab(selected)}
          >
            {tab.label}
          </Link>
        );
      })}
    </FolderTabBar>
  );
}
