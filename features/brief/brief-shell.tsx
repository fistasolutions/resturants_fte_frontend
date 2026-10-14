"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { BriefDatePicker } from "@/features/brief/brief-date-picker";
import { BriefHeader } from "@/features/brief/brief-header";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { resolveCompareMode, resolveDateRange } from "@/lib/date-range";
import { briefQueries } from "@/lib/queries/brief";
import { dateToISO, isValidISODate } from "@/utils/date";

/**
 * Persistent Morning Brief shell (SPEC-232). The greeting is time-of-day and comes
 * from the layout; the range and archive date come from the URL — so the top bar
 * paints instantly. The one data-dependent piece, the brief's date, reads the same
 * cached query the view reads and fills in when it lands (an inline skeleton until
 * then — exactly what the old skeleton drew). The history, overdue and traffic
 * review flows own their own headers and pass through bare.
 */
export function BriefShell({
  greeting,
  children,
}: {
  greeting: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { calendarSystem } = useWorkspace();
  if (pathname !== "/brief") return <>{children}</>;

  const params = Object.fromEntries(searchParams.entries());
  const requestedDate = params.date && isValidISODate(params.date) ? params.date : null;
  const isArchive = requestedDate !== null;
  const range = resolveDateRange(params, dateToISO(new Date()));
  const compare = resolveCompareMode(params.compare, calendarSystem);

  return <BriefTopBar {...{ greeting, requestedDate, isArchive, range, compare, children }} />;
}

function BriefTopBar({
  greeting,
  requestedDate,
  isArchive,
  range,
  compare,
  children,
}: {
  greeting: string;
  requestedDate: string | null;
  isArchive: boolean;
  range: ReturnType<typeof resolveDateRange>;
  compare: ReturnType<typeof resolveCompareMode>;
  children: React.ReactNode;
}) {
  const history = useApiQuery(briefQueries.history(1, 7));
  const brief = useApiQuery(
    requestedDate
      ? briefQueries.byDate(requestedDate)
      : briefQueries.data({ from: range.from, to: range.to, compare }),
  );
  const yesterday = brief.data?.yesterday;
  const historyItems = history.data?.items ?? [];

  return (
    <div className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      {/* Top bar — header + pickers. One range+compare picker drives the whole page
          (SPEC-075). Hidden in archive view — archive is frozen, live compare data
          doesn't apply there. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {yesterday ? (
          <BriefHeader greeting={greeting} yesterday={yesterday} />
        ) : (
          <h1 className="font-heading text-2xl tracking-wide">
            {greeting} 👋 &mdash;{" "}
            <Skeleton className="inline-block h-6 w-56 max-w-full align-middle" />
          </h1>
        )}
        <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">
          {!isArchive && (
            <DateRangePicker
              from={range.from}
              to={range.to}
              preset={range.preset}
              label={range.label}
              basePath="/brief"
              preserveDateParam
            />
          )}
          {historyItems.length > 0 && yesterday && (
            <BriefDatePicker currentDate={yesterday.date} history={historyItems} />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
