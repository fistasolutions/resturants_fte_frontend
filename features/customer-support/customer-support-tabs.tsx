"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { ShallowLink } from "@/components/shared/shallow-link";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { clientApi } from "@/lib/client-api";
import {
  CS_ROOT,
  SUPPORT_TAB_IDS,
  SUPPORT_TAB_LABELS,
  normalizeSupportTab,
  supportHref,
  type SupportTab,
} from "@/lib/customer-support";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import type { QueryDef } from "@/lib/query-def";
import { DEFAULT_APPROVALS_VIEW } from "@/lib/support-approvals";
import { DEFAULT_INBOX_VIEW } from "@/lib/support-inbox";

/** The read each tab opens with — warmed on hover or focus so the click lands on data. */
function queryFor(tab: SupportTab): QueryDef<unknown> | null {
  switch (tab) {
    case "overview":
      return customerSupportQueries.overview();
    case "inbox":
      return customerSupportQueries.inbox(DEFAULT_INBOX_VIEW.queue, DEFAULT_INBOX_VIEW.sort, 1);
    case "approvals":
      return customerSupportQueries.approvalsPage(DEFAULT_APPROVALS_VIEW);
    case "topics":
      return customerSupportQueries.topics();
    case "knowledge":
      return customerSupportQueries.knowledge();
    case "insights":
      return customerSupportQueries.insights();
    case "performance":
      return customerSupportQueries.performance();
    default:
      return null;
  }
}

/**
 * The tab bar (SPEC-346): real anchors moved with `history.pushState` (SPEC-301) — no server
 * round trip per switch. Hovering or focusing a tab starts its read.
 */
export function CustomerSupportTabs() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const active = normalizeSupportTab(params.get("tab"));

  function warm(tab: SupportTab) {
    const def = queryFor(tab);
    if (def) void queryClient.prefetchQuery({ queryKey: def.queryKey, queryFn: () => def.load(clientApi) });
  }

  // SPEC-338: tabs the member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs(CS_ROOT, SUPPORT_TAB_IDS, (tab) => tab, active);
  return (
    <FolderTabBar role="tablist" label="Customer Support Agent sections">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <ShallowLink
            key={tab}
            href={supportHref(tab)}
            role="tab"
            aria-selected={selected}
            onMouseEnter={() => warm(tab)}
            onFocus={() => warm(tab)}
            {...folderTab(selected)}
          >
            {SUPPORT_TAB_LABELS[tab]}
          </ShallowLink>
        );
      })}
    </FolderTabBar>
  );
}
