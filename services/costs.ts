/**
 * Costs service — server transport (SPEC-251). The read is defined in
 * `lib/queries/costs.ts`; this is its `serverApi` face (SPEC-230 convention).
 */
import { serverApi } from "@/lib/api";
import { costsQueries, type CostsQuery } from "@/lib/queries/costs";
import type { ApiCostSummary } from "@/types/costs";

export async function getCostSummary(q: CostsQuery): Promise<ApiCostSummary> {
  return costsQueries.summary(q).load(serverApi);
}
