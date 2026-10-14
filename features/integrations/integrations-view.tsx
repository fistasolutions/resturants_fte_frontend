"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, LayoutGrid, Package, Plug, Search } from "lucide-react";

import IntegrationsLoading from "@/app/(app)/integrations/loading";
import { FolderPanel, FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { ActivityFeed } from "@/features/integrations/hub/activity-feed";
import { BrowseTab } from "@/features/integrations/hub/browse-tab";
import { ConnectedTab } from "@/features/integrations/hub/connected-tab";
import { HealthStrip } from "@/features/integrations/hub/health-strip";
import { HubNoticeLine } from "@/features/integrations/hub/hub-notice-line";
import { IncludedTab } from "@/features/integrations/hub/included-tab";
import { NeedsYou } from "@/features/integrations/hub/needs-you";
import { useApiQuery } from "@/hooks/use-api-query";
import { useHydrated } from "@/hooks/use-hydrated";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { browseKeys } from "@/lib/company-switches";
import { INTEGRATION_KEYS } from "@/lib/integration-catalog";
import {
  hubHref,
  overviewPollInterval,
  parseCategory,
  parseFilter,
  parseHubTab,
  parseLayout,
  type HubTab,
} from "@/lib/integration-hub";
import { klaviyoHubForward } from "@/lib/klaviyo-connect";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";

const TABS: { key: HubTab; label: string; icon: typeof Plug }[] = [
  { key: "connected", label: "Connected", icon: Plug },
  { key: "browse", label: "Browse apps", icon: LayoutGrid },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "included", label: "Included in your plan", icon: Package },
];

/** Sign-in returns that used to land here now belong to the app's own page (SPEC-328). */
function legacyReturn(params: URLSearchParams): string | null {
  const google = params.get("google");
  if (google) return `/integrations/gsc?tab=settings&google=${encodeURIComponent(google)}`;
  const meta = params.get("meta");
  if (meta) return `/integrations/meta?tab=settings&meta=${encodeURIComponent(meta)}`;
  // SPEC-371: Connect with Klaviyo returns to the hub; its result belongs to Klaviyo's page.
  return klaviyoHubForward(params);
}

/**
 * The Integrations hub (SPEC-328 over backend SPEC-337): health first, then what needs the
 * owner, then four folder tabs held in the URL. Every figure is the backend's; the page
 * polls only while something is syncing.
 */
export function IntegrationsView() {
  const hydrated = useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const tab = parseHubTab(params.get("tab"));
  const filter = parseFilter(params.get("filter"));
  const layout = parseLayout(params.get("view"));
  const category = parseCategory(params.get("category"));
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const { visibility } = useWorkspace();
  // SPEC-360: a guided organization's Browse lists only the apps its workspace uses.
  const browseCount = browseKeys(visibility, INTEGRATION_KEYS).length;

  const overviewQ = useApiQuery(integrationQueries.overview(), {
    refetchInterval: (q) => overviewPollInterval(q.state.data),
  });
  const settingsQ = useApiQuery(integrationQueries.settings());

  const redirect = legacyReturn(new URLSearchParams(params.toString()));
  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || target?.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      search.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!hydrated || overviewQ.isPending || redirect) return <IntegrationsLoading />;
  if (overviewQ.isError) {
    return <QueryErrorState error={overviewQ.error} onRetry={() => void overviewQ.refetch()} />;
  }
  const overview = overviewQ.data;
  const connections = overview.integrations;
  const connectedCount = overview.summary.connected;
  const needYou = overview.summary.attention + overview.summary.warning;
  const searchable = tab === "connected" || tab === "browse";

  return (
    <div className="flex flex-col gap-6">
      <HealthStrip overview={overview} active={tab === "connected" ? filter : null} view={layout} />
      <NeedsYou connections={connections} />
      <HubNoticeLine />

      <div>
        <FolderTabBar label="Integrations view">
          {TABS.map((item) => {
            const active = item.key === tab;
            const count =
              item.key === "connected" ? connectedCount : item.key === "browse" ? browseCount : null;
            return (
              <ShallowLink
                key={item.key}
                href={hubHref({ tab: item.key, filter: item.key === "connected" ? filter : undefined, view: layout })}
                aria-current={active ? "page" : undefined}
                {...folderTab(active)}
              >
                <item.icon className="size-3.5" aria-hidden />
                {item.label}
                {count !== null ? (
                  <span
                    className={cn(
                      "inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                      item.key === "connected" && needYou
                        ? "bg-destructive/12 text-destructive"
                        : "bg-foreground/8",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </ShallowLink>
            );
          })}
        </FolderTabBar>
        <FolderPanel>
          {searchable ? (
            <label className="relative flex max-w-md items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
              <input
                ref={search}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tab === "browse" ? "Search apps" : "Search connected apps and pages"}
                aria-label="Search integrations"
                className="h-9 w-full rounded-[10px] border bg-card pr-10 pl-9 text-sm outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/20"
              />
              <kbd className="pointer-events-none absolute right-2.5 rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
                /
              </kbd>
            </label>
          ) : null}
          {tab === "connected" ? (
            <ConnectedTab
              connections={connections}
              filter={filter}
              layout={layout}
              query={query}
              onClearQuery={() => setQuery("")}
            />
          ) : null}
          {tab === "browse" ? (
            <BrowseTab connections={connections} category={category} query={query} onClearQuery={() => setQuery("")} />
          ) : null}
          {tab === "activity" ? <ActivityFeed connections={connections} /> : null}
          {tab === "included" ? (
            settingsQ.isPending ? (
              <IntegrationsLoading />
            ) : settingsQ.isError ? (
              <QueryErrorState error={settingsQ.error} onRetry={() => void settingsQ.refetch()} />
            ) : (
              <IncludedTab settings={settingsQ.data} connections={connections} />
            )
          ) : null}
        </FolderPanel>
      </div>
    </div>
  );
}
