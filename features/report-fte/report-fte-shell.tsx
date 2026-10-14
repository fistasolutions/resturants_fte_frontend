"use client";

import { usePathname } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { ReportFteTabs } from "@/features/report-fte/report-fte-tabs";
import { isReportFteFramedRoute } from "@/lib/report-fte-tabs";

const DESCRIPTION =
  "One digital employee that builds any report from the figures every page uses — every number traced to its tool.";

/**
 * Persistent Report FTE shell (SPEC-256). Rendered from the `/report-fte` layout,
 * so the header and the tab bar never re-render as part of a tab switch — only
 * `{children}` changes. Any unframed route under `/report-fte` renders bare.
 */
export function ReportFteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!isReportFteFramedRoute(pathname)) return <>{children}</>;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb current="Report Builder" />
        <PageHeader
          title="Report Builder"
          description={DESCRIPTION}
          actions={<StatusBadge tone="ai">Digital employee · authority level 2</StatusBadge>}
        />
      </div>
      <div>
        <ReportFteTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
