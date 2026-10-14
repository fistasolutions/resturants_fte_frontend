"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsTabs } from "@/features/settings/settings-tabs";
import { canSeeTab, firstVisibleTab, tabForPath, visibleGroups, type SettingsTabKey } from "@/lib/settings-nav";

/**
 * Persistent Settings shell (SPEC-097, SPEC-324). Rendered from `settings/layout.tsx`, so the
 * header and the two-row tab bar stay painted across tab switches — only `{children}` swaps. The
 * active tab and its description come from the pathname. Only the tabs the member's role allows
 * are drawn, and a member who reaches a tab that is not theirs is moved to their first one
 * (Profile is always theirs, so this never loops; the backend refuses the data regardless).
 */
export function SettingsShell({
  permissions,
  badges,
  children,
}: {
  /** The member's effective permissions; `null` while `/auth/me` is still on its way. */
  permissions: readonly string[] | null;
  badges: Partial<Record<SettingsTabKey, React.ReactNode>>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const tab = tabForPath(pathname);
  const groups = useMemo(() => (permissions ? visibleGroups(permissions) : null), [permissions]);
  const allowed = permissions === null || canSeeTab(tab, permissions);

  useEffect(() => {
    if (permissions !== null && !canSeeTab(tab, permissions)) {
      router.replace(firstVisibleTab(permissions).href);
    }
  }, [permissions, tab, router]);

  return (
    <main className="space-y-6 p-4 md:p-6">
      <PageHeader title="Settings" description={tab.description} />
      <SettingsTabs groups={groups} activeGroup={tab.group} activeTab={tab.key} badges={badges}>
        {allowed ? children : null}
      </SettingsTabs>
    </main>
  );
}
