import Link from "next/link";

import { FolderPanel, FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SettingsGroup, SettingsGroupKey, SettingsTabKey } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

/**
 * The Settings navigation (SPEC-324, folder tabs SPEC-325): two full-width rows. Row one switches the group — Store,
 * Organization, Account; row two is that group's tabs. Every tab is a real route, so a reload or a
 * shared link lands on the same tab, and only the tabs the member's role allows are drawn.
 */
export function SettingsTabs({
  groups,
  activeGroup,
  activeTab,
  badges,
  children,
}: {
  /** The groups this member sees; `null` while their access is still being read. */
  groups: SettingsGroup[] | null;
  activeGroup: SettingsGroupKey;
  activeTab: SettingsTabKey;
  badges: Partial<Record<SettingsTabKey, React.ReactNode>>;
  /** The open tab's body — drawn in the folder panel the active tab opens into (SPEC-325). */
  children: React.ReactNode;
}) {
  if (groups === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-72 max-w-full rounded-lg" aria-hidden />
        <div>
          <div className="flex gap-2 px-1 pt-1" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-b-none" />
            ))}
          </div>
          <FolderPanel>{children}</FolderPanel>
        </div>
      </div>
    );
  }
  const current = groups.find((g) => g.key === activeGroup) ?? groups[0];

  return (
    <div className="space-y-3">
      {groups.length > 1 ? (
        <nav aria-label="Settings groups" className="flex">
          <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1 scrollbar-none">
            {groups.map((group) => {
              const active = group.key === current.key;
              return (
                <Link
                  key={group.key}
                  href={group.tabs[0].href}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {group.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
      <div>
        <FolderTabBar label={`${current.label} settings`}>
          {current.tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                {...folderTab(active)}
              >
                {tab.label}
                {badges[tab.key]}
              </Link>
            );
          })}
        </FolderTabBar>
        <FolderPanel>{children}</FolderPanel>
      </div>
    </div>
  );
}

/** The small state badges a tab can carry (On/Off, n of m). */
export function TabBadge({ tone, children }: { tone: "success" | "warning" | "muted"; children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 px-1.5 text-[11px] tabular-nums",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "warning" && "border-warning/30 bg-warning/10 text-warning",
      )}
    >
      {children}
    </Badge>
  );
}
