"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { ordersPageHref, parseOrderFilters } from "@/lib/order-filters";
import { ORDERS_TABS, activeOrdersTab } from "@/lib/order-tabs";

/**
 * Orders tab bar (SPEC-087). Lives in the persistent orders layout, so it stays
 * mounted across tab switches — the active underline moves instantly on click
 * (`usePathname`), before the new tab's data loads, and the bar never re-renders
 * as part of the content swap. Every active filter is read from the URL and
 * carried onto each tab link (SPEC-079), so filters survive a switch.
 */
export function OrdersTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeOrdersTab(pathname);
  const filters = parseOrderFilters(Object.fromEntries(searchParams.entries()));

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/orders", ORDERS_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="Orders view">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={ordersPageHref(filters, 1, tab.basePath)}
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
