import type { Metadata } from "next";

import { SidebarPrefsView } from "@/features/settings/sidebar-prefs-view";

export const metadata: Metadata = {
  title: "Sidebar — Settings",
};

/** Account → Sidebar (SPEC-338). Tab body only — chrome lives in the persistent shell. Nothing to
 * fetch: the choices come from the layout's cookie read, the pages from the workspace. */
export default function Page() {
  return <SidebarPrefsView />;
}
