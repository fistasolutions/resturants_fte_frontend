import { serverApi } from "@/lib/api";
import { ciPlanQueries } from "@/lib/queries/ci-plans";
import type { CiPlan, CiPlanList } from "@/types/ci-plans";

/** Server-side face of the CI Plans registry (SPEC-272) — same definitions, `serverApi`. */
export async function getCiPlans(): Promise<CiPlanList> {
  return ciPlanQueries.list().load(serverApi);
}

export async function getCiPlan(id: number): Promise<CiPlan> {
  return ciPlanQueries.plan(id).load(serverApi);
}
