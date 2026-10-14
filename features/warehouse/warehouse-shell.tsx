"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { IpackyUpload } from "@/features/warehouse/ipacky-upload";
import { resolveDateRange } from "@/lib/date-range";
import { dateToISO } from "@/utils/date";

/**
 * Persistent Warehouse shell (SPEC-232). The date picker reads the URL, not data, so
 * it belongs with the header. Backlog and packer sub-routes own their own headers.
 */
export function WarehouseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pathname !== "/warehouse") return <>{children}</>;

  const range = resolveDateRange(Object.fromEntries(searchParams.entries()), dateToISO(new Date()));
  return (
    <main className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Warehouse"
        description="Packing performance from iPacky, and the live unfulfilled backlog from Shopify — who's packing, how fast, and whether orders are getting stuck."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <IpackyUpload />
            <DateRangePicker
              from={range.from}
              to={range.to}
              preset={range.preset}
              label={range.label}
              basePath="/warehouse"
            />
          </div>
        }
      />
      {children}
    </main>
  );
}
