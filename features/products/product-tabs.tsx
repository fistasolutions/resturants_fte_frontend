"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { PRODUCT_TABS, activeProductTab, productTabHref } from "@/lib/product-tabs";

/**
 * Product Analyst tab bar (SPEC-090). Lives in the persistent product layout, so
 * it stays mounted across tab switches — the active underline moves instantly on
 * click (`usePathname`), before the new tab's data loads, and the bar never
 * re-renders as part of the content swap. The date range is read from the URL
 * and carried onto every tab link so a custom range survives a switch.
 */
export function ProductTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeProductTab(pathname);

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/products", PRODUCT_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="Product sections">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={productTabHref(tab.basePath, searchParams)}
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
