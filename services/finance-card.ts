/**
 * Monday payable card — the one write (SPEC-310, backend SPEC-307): switch the weekly
 * job on or off, through the proxy. Mirrors `services/manager-report-card.ts`.
 */
import type { FinanceCardSchedule } from "@/types/store";

const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

interface ApiFinanceCard {
  enabled: boolean;
  weekday: string;
  time: string;
  timezone: string;
  next_run_at: string | null;
}

export function adaptFinanceCard(api: ApiFinanceCard): FinanceCardSchedule {
  return {
    enabled: api.enabled,
    weekday: api.weekday,
    time: api.time,
    timezone: api.timezone,
    nextRunAt: api.next_run_at,
  };
}

export async function updateFinanceCard(enabled: boolean): Promise<FinanceCardSchedule> {
  const response = await fetch(`${base}/settings/finance-card`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Could not save the finance-card schedule.");
  }
  return adaptFinanceCard(data.finance_card);
}
