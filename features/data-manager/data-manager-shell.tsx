"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Upload } from "lucide-react";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ShallowLink } from "@/components/shared/shallow-link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataManagerProvider } from "@/features/data-manager/data-manager-context";
import { DataManagerTabs } from "@/features/data-manager/data-manager-tabs";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { DATA_MANAGER_BASE, DATA_MANAGER_TITLE, dataTabHref } from "@/lib/data-manager";

/**
 * Persistent shell for `/data-manager` (SPEC-374, on the SPEC-232 pattern): breadcrumb, header and
 * folder tabs stay painted while only the tab's content changes. No status bar (frontend SPEC-375):
 * the connection and the reading controls live on Sources and Settings.
 */
export function DataManagerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== DATA_MANAGER_BASE) return <>{children}</>;
  return (
    <DataManagerProvider>
      <main className="space-y-6 p-4 md:p-6">
        <div className="space-y-2">
          <EmployeeBreadcrumb current={DATA_MANAGER_TITLE} />
          <PageHeader
            title={DATA_MANAGER_TITLE}
            description="Your sheets and invoices, turned into real cost and profit. Brings your Airtable bases and any spreadsheet or invoice in as exact copies, matches every row to your products, and works out your real cost, real selling price and real profit. Nobody types a number in by hand, and nothing changes your costs until you approve it."
            actions={
              <ShallowLink href={dataTabHref("sources")} className={buttonVariants({ variant: "outline" })}>
                <Upload aria-hidden />
                Upload a sheet
              </ShallowLink>
            }
          />
        </div>
        <div>
          <Suspense fallback={<Skeleton className="h-9 w-full max-w-3xl rounded-lg" aria-hidden />}>
            <DataManagerTabs />
          </Suspense>
          <FolderPanel>{children}</FolderPanel>
        </div>
      </main>
    </DataManagerProvider>
  );
}
