"use client";

import { useSearchParams } from "next/navigation";

import { ChangesTab } from "@/features/data-manager/changes-tab";
import { MatchingTab } from "@/features/data-manager/matching-tab";
import { OverviewTab } from "@/features/data-manager/overview-tab";
import { ProfitTab } from "@/features/data-manager/profit-tab";
import { SettingsTab } from "@/features/data-manager/settings-tab";
import { SourcesTab } from "@/features/data-manager/sources-tab";
import { TablesTab } from "@/features/data-manager/tables-tab";
import { normalizeDataTab, type DataTab } from "@/lib/data-manager";

const TAB_VIEWS: Record<DataTab, () => React.ReactNode> = {
  overview: OverviewTab,
  sources: SourcesTab,
  tables: TablesTab,
  matching: MatchingTab,
  profit: ProfitTab,
  changes: ChangesTab,
  settings: SettingsTab,
};

/** Data Manager's content (SPEC-374): the tab the URL names, read in the browser (SPEC-301). */
export function DataManagerView() {
  const tab = normalizeDataTab(useSearchParams().get("tab"));
  const View = TAB_VIEWS[tab];
  return <View />;
}
