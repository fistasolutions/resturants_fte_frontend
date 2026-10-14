"use client";

import Link from "next/link";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";

import { SOCIAL_TAB_IDS, SOCIAL_TAB_LABELS, type SocialTab } from "@/lib/social";

/** URL-driven server tabs — real anchors (keyboard-navigable, shareable,
 * back-button friendly), mirroring the Spotlight / Returns pattern. Active
 * underline uses `bg-primary`. */
export function SocialTabs({ active }: { active: SocialTab }) {
  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/social", SOCIAL_TAB_IDS, (tab) => tab, active);
  return (
    <FolderTabBar role="tablist" label="Social Media Manager sections">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <Link
            key={tab}
            href={`/social?tab=${tab}`}
            role="tab"
            aria-selected={selected}
            {...folderTab(selected)}
          >
            {SOCIAL_TAB_LABELS[tab]}
          </Link>
        );
      })}
    </FolderTabBar>
  );
}
