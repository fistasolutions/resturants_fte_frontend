"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { InventoryTabs } from "@/features/inventory/inventory-tabs";
import { resolveDateRange } from "@/lib/date-range";
import { INVENTORY_TABS, activeInventoryTab } from "@/lib/inventory-tabs";
import { dateToISO } from "@/utils/date";

/** Range tabs share one description; Dead Inventory keeps its own (SPEC-085). */
const RANGE_DESCRIPTION =
  "What to reorder, what's stuck, and what's bleeding — ranked by money impact. Days of cover are projections from recent sales pace.";
const DEAD_INVENTORY_DESCRIPTION =
  "Stock that isn't selling anywhere — aged inventory and markdown candidates, ranked by cash frozen. Build a markdown plan to clear it.";

/**
 * Persistent Inventory Analyst shell (SPEC-085). Rendered from the inventory
 * `layout.tsx`, so it stays mounted across tab switches: the header (title +
 * date-range picker) and the tab bar never re-render as part of a content swap —
 * only `{children}` (the active tab's content) changes, showing its own
 * content-only skeleton while its data loads.
 *
 * On any non-tab route under `/inventory` (store-transfers, dead-inventory
 * detail pages, markdown-plan) it renders `{children}` bare — those pages own
 * their own header and `<main>`.
 */
export function InventoryShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeInventoryTab(pathname);

  if (!active) return <>{children}</>;

  const hasRange = INVENTORY_TABS.find((tab) => tab.key === active)?.hasRange ?? true;
  // Default 30d matches the data fetch in `InventoryPageContent`, so the picker
  // label and the loaded data never disagree.
  const range = resolveDateRange(
    {
      range: searchParams.get("range") ?? searchParams.get("period") ?? "30d",
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    },
    dateToISO(new Date()),
  );

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <PageHeader
        title="Inventory Analyst"
        description={hasRange ? RANGE_DESCRIPTION : DEAD_INVENTORY_DESCRIPTION}
        actions={
          hasRange ? (
            <DateRangePicker
              from={range.from}
              to={range.to}
              preset={range.preset}
              label={range.label}
              basePath={pathname}
            />
          ) : undefined
        }
      />
      <div>
        <InventoryTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
