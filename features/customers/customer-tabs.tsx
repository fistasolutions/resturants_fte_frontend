"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { CUSTOMER_TABS, activeCustomerTab, isCustomerTabRoute } from "@/lib/customer-tabs";

/**
 * Customers workspace tab bar (SPEC-189). Lives in the persistent layout so it
 * stays mounted across tab switches and the active underline moves on click,
 * before the next tab's data loads. Self-gates: nested routes such as
 * `/customers/winback` render without it rather than showing a bar with nothing
 * selected.
 */
export function CustomerTabs() {
  const pathname = usePathname();
  const active = activeCustomerTab(pathname);
  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/customers", CUSTOMER_TABS, (tab) => tab.key, active);
  if (!isCustomerTabRoute(pathname)) return null;

  return (
    <FolderTabBar label="Customer sections">
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
