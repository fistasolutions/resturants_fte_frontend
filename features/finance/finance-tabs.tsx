"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { ShallowLink } from "@/components/shared/shallow-link";
import { clientApi } from "@/lib/client-api";
import {
  FINANCE_SOON_TABS,
  FINANCE_TAB_IDS,
  filtersFromParams,
  financeHref,
  financeTabLabel,
  normalizeThrough,
  type FinanceTab,
} from "@/lib/finance";
import { chatQueries } from "@/lib/queries/chat";
import { financeQueries } from "@/lib/queries/finance";
import type { QueryDef } from "@/lib/query-def";

/** The read each tab opens with — prefetched on hover or focus, so the click usually
 * lands on data already in the cache. */
function queryFor(tab: FinanceTab, params: URLSearchParams): QueryDef<unknown> {
  switch (tab) {
    case "run":
      return financeQueries.run(normalizeThrough(params.get("through")));
    case "aging":
      return financeQueries.aging();
    case "vendors":
      return financeQueries.vendors();
    case "cash":
      return financeQueries.cash(params.get("company") || "all");
    case "chat":
      return chatQueries.employeeConversations("finance");
    case "profile":
      return financeQueries.profile();
    case "value":
      return financeQueries.value(null);
    default:
      return financeQueries.ap();
  }
}

/**
 * The tab bar (SPEC-301) — real anchors, the Spotlight/Social bar's look. A plain click
 * moves the URL with `history.pushState` (no server round trip); hovering or focusing a
 * tab starts its read, so switching is instant on a warm cache. The Overview and Bills
 * share the bill filters, so switching between them keeps what the owner narrowed to.
 */
export function FinanceTabs({ active }: { active: FinanceTab }) {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const search = new URLSearchParams(params.toString());
  const filters = filtersFromParams(search);

  function warm(tab: FinanceTab) {
    const def = queryFor(tab, search);
    void queryClient.prefetchQuery({ queryKey: def.queryKey, queryFn: () => def.load(clientApi) });
  }

  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/employees/finance", FINANCE_TAB_IDS, (tab) => tab, active);
  return (
    <FolderTabBar role="tablist" label="Accounts Payable">
      {tabs.map((tab) => {
        const selected = tab === active;
        const keepsFilters = tab === "overview" || tab === "bills";
        return (
          <ShallowLink
            key={tab}
            href={financeHref(tab, keepsFilters ? filters : undefined)}
            role="tab"
            aria-selected={selected}
            onMouseEnter={() => warm(tab)}
            onFocus={() => warm(tab)}
            {...folderTab(selected)}
          >
            {financeTabLabel(tab)}
          </ShallowLink>
        );
      })}
      {FINANCE_SOON_TABS.map((label) => (
        <span
          key={label}
          aria-disabled="true"
          title={`${label} across your companies — coming next`}
          className="folder-tab"
        >
          {label}
          <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-bold text-muted-foreground">Soon</span>
        </span>
      ))}
    </FolderTabBar>
  );
}
