/**
 * Monday report card — client-side actions (SPEC-241, backend SPEC-248): send the card
 * now (one store or every configured one) and switch the weekly job on or off, both
 * through the proxy. Mirrors `services/brief-auto-send.ts`.
 */
import { adaptReportCardSend, type ApiReportCardSendResult } from "@/lib/adapters";
import { resultPaths } from "@/lib/queries/results";
import type { ReportCardSendResult } from "@/types/results";
import type { ManagerReportCardSchedule } from "@/types/store";

const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

interface ApiManagerReportCard {
  enabled: boolean;
  weekday: string;
  time: string;
  timezone: string;
  next_run_at: string | null;
}

export function adaptManagerReportCard(api: ApiManagerReportCard): ManagerReportCardSchedule {
  return {
    enabled: api.enabled,
    weekday: api.weekday,
    time: api.time,
    timezone: api.timezone,
    nextRunAt: api.next_run_at,
  };
}

export async function sendReportCard(
  locationId: number | null,
  force = false,
): Promise<ReportCardSendResult> {
  const response = await fetch(`${base}${resultPaths.reportCardSend()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location_id: locationId, force }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Could not send the report card.");
  }
  return adaptReportCardSend(data as ApiReportCardSendResult);
}

export async function updateManagerReportCard(
  enabled: boolean,
): Promise<ManagerReportCardSchedule> {
  const response = await fetch(`${base}/settings/manager-report-card`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Could not save the report-card schedule.");
  }
  return adaptManagerReportCard(data.manager_report_card);
}
