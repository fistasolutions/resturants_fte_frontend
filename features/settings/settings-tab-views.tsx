"use client";

import { useSearchParams } from "next/navigation";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { LocationManagersPanel, TeamRecipientsPanel } from "@/features/settings/recipient-panels";
import { ReturnLink } from "@/features/settings/return-link";
import {
  AutomaticSendingSkeleton,
  ManagerNotificationsSkeleton,
  SchedulePanelSkeleton,
  StoreGeneralSkeleton,
} from "@/features/settings/settings-skeletons";
import {
  BriefAutoSendPanel,
  DailyReportPanel,
  FinanceCardPanel,
  ManagerReportCardPanel,
  StoreConnectionPanel,
  SystemStatusPanel,
} from "@/features/settings/store-panels";
import { useApiQuery } from "@/hooks/use-api-query";
import { storeQueries } from "@/lib/queries/store";
import { parseFocus, parseReturnPath } from "@/lib/recipient-settings";

/**
 * The Store tab bodies (SPEC-097, SPEC-324), read from the client cache (SPEC-230). All four
 * share the one settings-overview answer the layout streams in, so switching between them never
 * fetches again; each panel keeps its own edit/save state.
 */

function useOverview() {
  return useApiQuery(storeQueries.settingsOverview());
}

export function SettingsGeneralTab() {
  const overview = useOverview();
  if (overview.isPending) return <StoreGeneralSkeleton />;
  if (overview.isError) {
    return <QueryErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  }
  return (
    <div className="grid grid-cols-1 gap-5">
      <StoreConnectionPanel store={overview.data.connection} status={overview.data.system} />
      <SystemStatusPanel status={overview.data.system} />
    </div>
  );
}

export function SettingsDailyReportTab() {
  const overview = useOverview();
  if (overview.isPending) return <SchedulePanelSkeleton />;
  if (overview.isError) {
    return <QueryErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  }
  return <DailyReportPanel schedule={overview.data.reportSchedule} />;
}

export function SettingsAutomaticSendingTab() {
  const overview = useOverview();
  if (overview.isPending) return <AutomaticSendingSkeleton />;
  if (overview.isError) {
    return <QueryErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  }
  return (
    <div className="grid grid-cols-1 gap-5">
      <BriefAutoSendPanel schedule={overview.data.briefAutoSend} />
      <ManagerReportCardPanel schedule={overview.data.managerReportCard} />
      <FinanceCardPanel schedule={overview.data.financeCard} />
    </div>
  );
}

/**
 * A send page with no recipient deep-links here as `?focus=<field>&return=<page>` (SPEC-234):
 * the named row is highlighted and focused, and its save goes back to that page. With a return
 * page but no specific row (the location is unknown), a plain "go back" link stands in.
 */
export function SettingsManagerNotificationsTab() {
  const overview = useOverview();
  const searchParams = useSearchParams();
  const focus = parseFocus(searchParams.get("focus"));
  const returnTo = parseReturnPath(searchParams.get("return"));
  if (overview.isPending) return <ManagerNotificationsSkeleton />;
  if (overview.isError) {
    return <QueryErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  }
  const data = overview.data;
  return (
    <div className="grid grid-cols-1 gap-5">
      {returnTo && !focus ? (
        <div>
          <ReturnLink returnTo={returnTo} />
        </div>
      ) : null}
      <LocationManagersPanel
        locations={data.locationManagers}
        focusLocationId={focus?.kind === "location" ? focus.locationId : null}
        returnTo={returnTo}
      />
      <TeamRecipientsPanel
        warehouseEmail={data.warehouseEmail}
        supportEmail={data.supportEmail}
        returnsEmail={data.returnsEmail}
        focus={focus && focus.kind !== "location" ? focus.kind : null}
        returnTo={returnTo}
      />
    </div>
  );
}
