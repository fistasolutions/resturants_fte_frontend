"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ShallowLink } from "@/components/shared/shallow-link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerSupportTabs } from "@/features/customer-support/customer-support-tabs";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { CS_ROOT, CUSTOMER_SUPPORT_TITLE, supportHref } from "@/lib/customer-support";

const DESCRIPTION =
  "Answers and resolves customer conversations in your helpdesk, with the real order, shipment, return, fit, stock and margin behind every reply. Your helpdesk stays the inbox and does the sending; nothing goes out without your approval unless you switch a topic to autopilot.";

/**
 * Persistent shell for `/customer-support` (SPEC-346 on the SPEC-232 pattern): breadcrumb,
 * header and the tab bar stay painted while only the tab's content changes. No status strip under
 * the header (SPEC-375): a paused employee resumes from Settings. Anything under the route passes
 * through bare.
 */
export function CustomerSupportShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== CS_ROOT) return <>{children}</>;
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb current={CUSTOMER_SUPPORT_TITLE} />
        <PageHeader
          title={CUSTOMER_SUPPORT_TITLE}
          description={DESCRIPTION}
          actions={
            <ShallowLink href={supportHref("chat")} className={buttonVariants({ size: "sm" })}>
              Ask the agent
            </ShallowLink>
          }
        />
      </div>
      <div>
        <Suspense fallback={<Skeleton className="h-9 w-full max-w-3xl rounded-lg" aria-hidden />}>
          <CustomerSupportTabs />
        </Suspense>
        <FolderPanel>{children}</FolderPanel>
      </div>
    </main>
  );
}
