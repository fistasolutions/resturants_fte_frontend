/** Planning queries (cash release, allocation, staffing, nexus) — defined once for
 * both transports (SPEC-230). Every loader resolves null on failure, exactly as
 * `services/planning.ts` did, so each page degrades to its empty state. */
import { defineQuery, type ApiGet } from "@/lib/query-def";
import type {
  AllocationPlan,
  CashReleasePlan,
  NexusThresholds,
  StaffingPlan,
} from "@/types/planning";

export const planningPaths = {
  cashRelease: (): string => "/analysis/inventory/cash-release-plan",
  allocation: (): string => "/analysis/inventory/allocation-plan",
  staffing: (start?: string, end?: string): string => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const query = params.toString();
    return `/traffic/staffing-plan${query ? `?${query}` : ""}`;
  },
  nexus: (): string => "/tax-reports/nexus",
} as const;

async function orNull<T>(api: ApiGet, path: string): Promise<T | null> {
  try {
    return await api<T>(path);
  } catch {
    return null;
  }
}

export const planningQueries = {
  cashRelease: () =>
    defineQuery<CashReleasePlan | null>(["planning", "cash-release"], (api) =>
      orNull<CashReleasePlan>(api, planningPaths.cashRelease()),
    ),
  allocation: () =>
    defineQuery<AllocationPlan | null>(["planning", "allocation"], (api) =>
      orNull<AllocationPlan>(api, planningPaths.allocation()),
    ),
  staffing: (start?: string, end?: string) =>
    defineQuery<StaffingPlan | null>(
      ["planning", "staffing", { start: start ?? null, end: end ?? null }],
      (api) => orNull<StaffingPlan>(api, planningPaths.staffing(start, end)),
    ),
  nexus: () =>
    defineQuery<NexusThresholds | null>(["planning", "nexus"], (api) =>
      orNull<NexusThresholds>(api, planningPaths.nexus()),
    ),
} as const;
