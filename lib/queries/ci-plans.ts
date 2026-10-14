/** CI Plans (SPEC-272): the two reads, through the client cache (SPEC-230). */
import { toCiPlan, toCiPlanList, type ApiCiPlan, type ApiCiPlanList } from "@/lib/ci-plans";
import { defineQuery } from "@/lib/query-def";
import type { CiPlan, CiPlanList } from "@/types/ci-plans";

export const CI_PLANS_KEY = ["ci-plans"] as const;

export const ciPlanPaths = {
  list: (): string => "/ci/plans",
  plan: (id: number): string => `/ci/plans/${id}`,
} as const;

export const ciPlanQueries = {
  list: () =>
    defineQuery<CiPlanList>([...CI_PLANS_KEY, "list"], async (api) =>
      toCiPlanList(await api<ApiCiPlanList>(ciPlanPaths.list())),
    ),
  plan: (id: number) =>
    defineQuery<CiPlan>([...CI_PLANS_KEY, "plan", id], async (api) =>
      toCiPlan(await api<ApiCiPlan>(ciPlanPaths.plan(id))),
    ),
} as const;
