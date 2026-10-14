"use client";

import Link from "next/link";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";

export type { ReturnsTab } from "@/lib/returns-tabs";
import { RETURNS_TAB_IDS, RETURNS_TAB_LABELS, type ReturnsTab } from "@/lib/returns-tabs";

/** URL-driven server tabs — real anchors (keyboard-navigable, shareable,
 * back-button friendly). Preserves the active date-range params across tabs. */
export function ReturnsTabs({
  active,
  query,
}: {
  active: ReturnsTab;
  query: Record<string, string | undefined>;
}) {
  const hrefFor = (tab: ReturnsTab) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value && key !== "tab") params.set(key, value);
    }
    params.set("tab", tab);
    return `/returns?${params.toString()}`;
  };

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/returns", RETURNS_TAB_IDS, (tab) => tab, active);
  return (
    <FolderTabBar role="tablist" label="Returns sections">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <Link
            key={tab}
            href={hrefFor(tab)}
            role="tab"
            aria-selected={selected}
            {...folderTab(selected)}
          >
            {RETURNS_TAB_LABELS[tab]}
          </Link>
        );
      })}
    </FolderTabBar>
  );
}
