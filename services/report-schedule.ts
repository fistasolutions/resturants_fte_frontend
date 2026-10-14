/**
 * Report schedule service — client-side (SPEC-031): updates the daily report
 * time through the proxy (backend SPEC-022).
 */
import type { ReportSchedule } from "@/types/store";

const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

interface ApiReportSchedule {
  time: string;
  timezone: string;
  source: "default" | "custom";
  next_run_at: string;
}

export function adaptReportSchedule(api: ApiReportSchedule): ReportSchedule {
  return {
    time: api.time,
    timezone: api.timezone,
    source: api.source,
    nextRunAt: api.next_run_at,
  };
}

export async function updateReportSchedule(time: string): Promise<ReportSchedule> {
  const response = await fetch(`${base}/settings/report-schedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ time }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Could not save the report schedule.");
  }
  return adaptReportSchedule(data.report_schedule);
}
