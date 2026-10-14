"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailMarketingTabs } from "@/features/email-marketing/email-marketing-tabs";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { EMAIL_MARKETING_BASE, EMAIL_MARKETING_TITLE } from "@/lib/email-marketing";

/**
 * Persistent shell for `/email-marketing` (SPEC-345 on the SPEC-232 pattern): breadcrumb,
 * header and the tab bar stay painted while only the tab's content changes. No status strip
 * under the header (SPEC-375): a paused employee resumes from Settings. Sub-routes (the builder,
 * a campaign, a flow) carry their own header and pass through bare.
 */
export function EmailMarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== EMAIL_MARKETING_BASE) return <>{children}</>;
  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb current={EMAIL_MARKETING_TITLE} />
        <PageHeader
          title={EMAIL_MARKETING_TITLE}
          description="Runs your email and SMS through Klaviyo — plans, audiences, campaigns, flows and tests — and judges every send by the profit it caused, not the revenue it claims. Nothing sends without your approval unless you switch a program to autopilot."
        />
      </div>
      <div>
        <Suspense fallback={<Skeleton className="h-9 w-full max-w-3xl rounded-lg" aria-hidden />}>
          <EmailMarketingTabs />
        </Suspense>
        <FolderPanel>{children}</FolderPanel>
      </div>
    </main>
  );
}
