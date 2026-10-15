"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel, FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { NetworkFilter } from "@/features/restaurant/network-filter";
import { PeriodPicker } from "@/features/restaurant/period-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { withParams } from "@/lib/restaurant";

export interface ShellTab {
  key: string;
  label: string;
  /** Head office only (the Access and Data tabs). */
  hqOnly?: boolean;
}

interface RestaurantShellProps {
  base: string;
  title: string;
  description: string;
  tabs?: readonly ShellTab[];
  defaultTab?: string;
  /** Whether this page's figures cover a period (the Access and Data tabs do not). */
  periodTabs?: readonly string[] | "all";
  /** Whether the page can be narrowed to a franchisee or a region. */
  filters?: boolean;
  children: React.ReactNode;
}

function Tabs({ base, tabs, defaultTab }: { base: string; tabs: readonly ShellTab[]; defaultTab: string }) {
  const params = useSearchParams();
  const setup = useApiQuery(restaurantQueries.setup());
  const isHq = setup.data?.scope.isHq ?? true;
  const active = params.get("tab") ?? defaultTab;
  const current = Object.fromEntries(params.entries());
  const allowed = tabs.filter((tab) => !tab.hqOnly || isHq);
  const shown = useVisibleTabs(base, allowed, (tab) => tab.key, active);
  return (
    <FolderTabBar role="tablist" label={`${base.slice(1)} sections`}>
      {shown.map((tab) => {
        const selected = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={withParams(base, current, { tab: tab.key === defaultTab ? null : tab.key })}
            role="tab"
            aria-selected={selected}
            {...folderTab(selected)}
          >
            {tab.label}
          </Link>
        );
      })}
    </FolderTabBar>
  );
}

function Controls({ periodTabs, defaultTab, filters }: { periodTabs: readonly string[] | "all"; defaultTab: string; filters: boolean }) {
  const params = useSearchParams();
  const active = params.get("tab") ?? defaultTab;
  const showPeriod = periodTabs === "all" || periodTabs.includes(active);
  if (!showPeriod) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {filters ? <NetworkFilter /> : <span />}
      <PeriodPicker />
    </div>
  );
}

/**
 * The persistent shell of a restaurant page (SPEC-377 on the SPEC-232 pattern): header, tabs and
 * the period and network filters stay painted while only the content changes. Sub-routes (a
 * branch, a franchisee) own their headers and pass through bare.
 */
export function RestaurantShell({
  base,
  title,
  description,
  tabs,
  defaultTab = tabs?.[0]?.key ?? "",
  periodTabs = "all",
  filters = true,
  children,
}: RestaurantShellProps) {
  const pathname = usePathname();
  if (pathname !== base) return <>{children}</>;
  return (
    <main className="space-y-4 p-4 md:p-6">
      <PageHeader title={title} description={description} />
      <Suspense fallback={<Skeleton className="h-8 w-full max-w-xl rounded-lg" aria-hidden />}>
        <Controls periodTabs={periodTabs} defaultTab={defaultTab} filters={filters} />
      </Suspense>
      {tabs ? (
        <div>
          <Suspense fallback={<Skeleton className="h-9 w-full max-w-3xl rounded-lg" aria-hidden />}>
            <Tabs base={base} tabs={tabs} defaultTab={defaultTab} />
          </Suspense>
          <FolderPanel>{children}</FolderPanel>
        </div>
      ) : (
        children
      )}
    </main>
  );
}
