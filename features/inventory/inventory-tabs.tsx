"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import {
  INVENTORY_TABS,
  activeInventoryTab,
  inventoryTabHref,
} from "@/lib/inventory-tabs";

/**
 * Inventory Analyst tab bar (SPEC-085). Lives in the persistent inventory
 * layout, so it stays mounted across tab switches — the active underline moves
 * instantly on click (`usePathname`), before the new tab's data loads, and the
 * bar never re-renders as part of the content swap. The date range is read from
 * the URL and carried onto every tab link so a custom range survives a switch.
 */
export function InventoryTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeInventoryTab(pathname);

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/inventory", INVENTORY_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="Inventory sections">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={inventoryTabHref(tab.basePath, searchParams)}
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
