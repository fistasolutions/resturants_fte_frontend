"use client";

import Link from "next/link";
import { useMemo } from "react";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { useWorkspace } from "@/features/workspace/workspace-provider";

import {
  spotlightTabLabel,
  spotlightTabsFor,
  type SpotlightTab,
} from "@/lib/spotlight";

/** URL-driven server tabs — real anchors (keyboard-navigable, shareable,
 * back-button friendly), mirroring the Returns pattern. Active underline uses
 * `bg-primary`. */
export function SpotlightTabs({ active }: { active: SpotlightTab }) {
  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  // SPEC-386: a restaurant brand's bar adds Local pages.
  const { features } = useWorkspace();
  const offered = useMemo(() => spotlightTabsFor(features), [features]);
  const tabs = useVisibleTabs("/spotlight", offered, (tab) => tab, active);
  return (
    <FolderTabBar role="tablist" label="Search Visibility sections">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <Link
            key={tab}
            href={tab === "brand-brain" ? "/spotlight/brand-brain/coverage" : `/spotlight?tab=${tab}`}
            role="tab"
            aria-selected={selected}
            {...folderTab(selected)}
          >
            {spotlightTabLabel(tab)}
          </Link>
        );
      })}
    </FolderTabBar>
  );
}
