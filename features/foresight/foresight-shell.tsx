"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { ForesightTabs } from "@/features/foresight/foresight-tabs";
import { activeForesightTab, resolveForesightRange } from "@/lib/foresight-tabs";

const DESCRIPTION =
  "The forward-looking view — true profit after COGS, discounts and returns, how " +
  "your stores stack up, whether you'll hit goal, and what to buy next. The cross-" +
  "platform picture no single tool can see.";

/** Persistent shell for the Foresight tabs (SPEC-152): header + date picker + tab bar
 * stay mounted across tab switches. Non-tab (nested) routes render bare. */
export function ForesightShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (activeForesightTab(pathname) === null) return <>{children}</>;

  const range = resolveForesightRange({
    range: searchParams.get("range") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <PageHeader
        title="Foresight"
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
        <ForesightTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
