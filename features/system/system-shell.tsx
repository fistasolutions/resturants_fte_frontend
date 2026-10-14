"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SystemTabs } from "@/features/system/system-tabs";
import { activeSystemTab } from "@/lib/system-tabs";

const DESCRIPTION =
  "Every scheduled job, whether it ran, and what it produced.";

/**
 * Persistent shell for the System tabs (SPEC-229): header + tab bar stay mounted
 * across tab switches, so the title never flashes and the active underline moves
 * instantly on click — before the new tab's data arrives.
 *
 * Non-tab routes render bare. `/system/[jobId]` carries its own breadcrumb and job
 * title; a section header above it would be two headers arguing about what the page
 * is called. Same rule `TrafficShell` uses for `stores/[locationId]`.
 */
export function SystemShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tab = activeSystemTab(pathname);
  if (tab === null) return <>{children}</>;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <PageHeader
        title="System"
        description={DESCRIPTION}
        actions={
          <Link
            href="/ai"
            className="inline-flex h-9 items-center rounded-[10px] border border-border px-3 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            AI Performance
          </Link>
        }
      />
      <div>
        <SystemTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
