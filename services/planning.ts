/** Planning service — server transport. Since SPEC-230 the paths, keys and loaders
 * live in `lib/queries/planning.ts`; this module is their `serverApi` face. Every
 * read resolves null on failure so the page degrades to its empty state. */
import { serverApi } from "@/lib/api";
import { planningQueries } from "@/lib/queries/planning";
import type {
  AllocationPlan,
  CashReleasePlan,
  NexusThresholds,
  StaffingPlan,
} from "@/types/planning";

export async function getCashReleasePlan(): Promise<CashReleasePlan | null> {
  return planningQueries.cashRelease().load(serverApi);
}

export async function getAllocationPlan(): Promise<AllocationPlan | null> {
  return planningQueries.allocation().load(serverApi);
}

export async function getStaffingPlan(start?: string, end?: string): Promise<StaffingPlan | null> {
  return planningQueries.staffing(start, end).load(serverApi);
}

export async function getNexusThresholds(): Promise<NexusThresholds | null> {
  return planningQueries.nexus().load(serverApi);
}
