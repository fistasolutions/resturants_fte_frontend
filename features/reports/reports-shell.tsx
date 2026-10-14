"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { HistoryMenu } from "@/features/reports/history-menu";
import { useApiQuery } from "@/hooks/use-api-query";
import { reportQueries } from "@/lib/queries/reports";
import { isValidISODate } from "@/utils/date";

/** The header's history menu needs the report list. It reads the same cached query the
 * view reads (one request, shared), so the header paints instantly and the menu fills
 * in when the list lands — the header itself is never gated behind data. */
function HistoryAction() {
  const params = useSearchParams();
  const list = useApiQuery(reportQueries.list(5));
  if (!list.data) return null;
  const requested = params.get("date");
  // Same resolution the view uses: an explicit valid ?date, else the newest report.
  const activeDate =
    requested && isValidISODate(requested) ? requested : (list.data.items[0]?.report_date ?? null);
  return <HistoryMenu reports={list.data.items} activeDate={activeDate} />;
}

/**
 * Persistent Daily Reports shell (SPEC-232). The history sub-route owns its own
 * header and passes through bare.
 */
export function ReportsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/reports") return <>{children}</>;
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Daily Reports"
        description="The AI-written executive briefing for each day — every report is stored, so the full history stays browsable."
        actions={<HistoryAction />}
      />
      {children}
    </main>
  );
}
