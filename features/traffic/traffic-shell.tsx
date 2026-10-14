"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { TrafficTabs } from "@/features/traffic/traffic-tabs";
import { activeTrafficTab, resolveTrafficRange } from "@/lib/traffic-tabs";

const DESCRIPTION =
  "In-store footfall from V-Count paired with your sales — visitors, conversion, " +
  "which store wins, and the revenue you're leaving on the table. The one thing " +
  "Shopify can't see.";

/** Persistent shell for the Store Traffic tabs (SPEC-112): header + date picker
 * + tab bar stay mounted across tab switches. Non-tab routes render bare. */
export function TrafficShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = activeTrafficTab(pathname);
  if (tab === null) return <>{children}</>;

  // The tab is passed so the picker's label and the page's data resolve the SAME
  // window — Staffing defaults to 90 days, the rest to 7 (SPEC-083's rule that the
  // label and the loaded data must never disagree).
  const range = resolveTrafficRange(
    {
      range: searchParams.get("range") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    },
    tab,
  );

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <PageHeader
        title="Store Traffic"
        description={DESCRIPTION}
        actions={
          <DateRangePicker
            from={range.from}
            to={range.to}
            preset={range.preset}
            label={range.label}
            basePath={pathname}
          />
        }
      />
      <div>
        <TrafficTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
