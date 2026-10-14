"use client";

import { useSearchParams } from "next/navigation";

import { folderTab, FolderTabBar } from "@/components/shared/folder-tabs";
import { ShallowLink } from "@/components/shared/shallow-link";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { useApiQuery } from "@/hooks/use-api-query";
import { EMAIL_TAB_IDS, EMAIL_TAB_LABELS, emailTabHref, normalizeEmailTab } from "@/lib/email-marketing";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";

/** The eleven tabs (SPEC-345), moved in place with `ShallowLink` (SPEC-301): a switch is one
 * frame from the cache, never a server render. Approvals carries its waiting count. */
export function EmailMarketingTabs() {
  const params = useSearchParams();
  const active = normalizeEmailTab(params.get("tab"));
  const approvals = useApiQuery(emailMarketingQueries.approvals());
  const waiting = approvals.data?.length ?? 0;
  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const tabs = useVisibleTabs("/email-marketing", EMAIL_TAB_IDS, (tab) => tab, active);
  return (
    <FolderTabBar role="tablist" label="Email Marketing Manager sections">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <ShallowLink key={tab} href={emailTabHref(tab)} role="tab" aria-selected={selected} {...folderTab(selected)}>
            {EMAIL_TAB_LABELS[tab]}
            {tab === "approvals" && waiting > 0 ? (
              <span className="rounded-full bg-warning/15 px-1.5 py-px text-[10px] font-bold tabular-nums text-warning">
                {waiting}
              </span>
            ) : null}
          </ShallowLink>
        );
      })}
    </FolderTabBar>
  );
}
