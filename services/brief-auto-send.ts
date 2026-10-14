/**
 * Brief auto-send schedule service — client-side (SPEC-069): turns
 * unattended overdue/transfer/winback/dead-inventory sending on/off and
 * sets its time through the proxy (backend SPEC-065).
 */
import type { BriefAutoSendSchedule } from "@/types/store";

const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

interface ApiBriefAutoSend {
  enabled: boolean;
  time: string;
  timezone: string;
  next_run_at: string | null;
}

export function adaptBriefAutoSend(api: ApiBriefAutoSend): BriefAutoSendSchedule {
  return {
    enabled: api.enabled,
    time: api.time,
    timezone: api.timezone,
    nextRunAt: api.next_run_at,
  };
}

export async function updateBriefAutoSend(
  enabled: boolean,
  time: string,
): Promise<BriefAutoSendSchedule> {
  const response = await fetch(`${base}/settings/brief-auto-send`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled, time }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Could not save the auto-send schedule.");
  }
  return adaptBriefAutoSend(data.brief_auto_send);
}
