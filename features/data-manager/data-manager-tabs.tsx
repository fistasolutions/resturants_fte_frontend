"use client";

import { useSearchParams } from "next/navigation";

import { folderTab, FolderTabBar } from "@/components/shared/folder-tabs";
import { ShallowLink } from "@/components/shared/shallow-link";
import { useDataManager } from "@/features/data-manager/data-manager-context";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { DATA_TAB_IDS, DATA_TAB_LABELS, dataTabHref, normalizeDataTab } from "@/lib/data-manager";

/** Data Manager's tabs (SPEC-374), moved in place with `ShallowLink` (SPEC-301). Changes carries
 * how many changes wait for approval. */
export function DataManagerTabs() {
  const params = useSearchParams();
  const active = normalizeDataTab(params.get("tab"));
  const { data, applied } = useDataManager();
  const waiting = applied ? 0 : data.pending.changes.length;
  const tabs = useVisibleTabs("/data-manager", DATA_TAB_IDS, (tab) => tab, active);
  return (
    <FolderTabBar role="tablist" label="Data Manager sections">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <ShallowLink key={tab} href={dataTabHref(tab)} role="tab" aria-selected={selected} {...folderTab(selected)}>
            {DATA_TAB_LABELS[tab]}
            {tab === "changes" && waiting > 0 ? (
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
