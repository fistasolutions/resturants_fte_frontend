"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";

/**
 * Persistent Sales & Tax shell (SPEC-232). Rendered from the route's `layout.tsx`
 * so the header paints instantly and stays mounted — before this the title was a
 * raw `<h1>` inside the data view, behind five queries, and the page sat blank until
 * the report list arrived. Sub-routes (a report, Nexus Watch) own their own header
 * and pass through bare.
 */
export function TaxReportsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/tax-reports") return <>{children}</>;

  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Sales & Tax Reports"
        description="Generated automatically on the 23rd (1st–22nd) and after each month closes (23rd–month end). Confirm the status, then download the Excel file."
        actions={
          // SPEC-221: this page has no tab bar, so Nexus Watch is reached from here
          // rather than inventing a tab model for one route.
          <Link
            href="/tax-reports/nexus"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Gauge className="size-4 text-muted-foreground" aria-hidden />
            Nexus Watch
          </Link>
        }
      />
      {children}
    </main>
  );
}
