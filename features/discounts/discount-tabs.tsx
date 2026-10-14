"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { DISCOUNT_TABS, activeDiscountTab, discountHref } from "@/lib/discount-tabs";

/** Discount workspace tab bar (SPEC-098) — lives in the persistent shell, so
 * the active underline moves instantly on click; the date range is carried. */
export function DiscountTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeDiscountTab(pathname);

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/discounts", DISCOUNT_TABS, (tab) => tab.key, active);
  return (
    <FolderTabBar label="Discount views">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={discountHref(tab.basePath, searchParams)}
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
