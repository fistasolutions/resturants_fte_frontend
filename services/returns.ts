/** Loop returns metrics + return fixes — server transport. Since SPEC-230 the paths,
 * keys and loaders live in `lib/queries/returns.ts`; this module is their
 * `serverApi` face. */
import { serverApi } from "@/lib/api";
import { returnQueries, type RangeQuery, type ReturnsMetricsQuery } from "@/lib/queries/returns";
import type { ReturnFixesData } from "@/types/analysis";
import type { ReturnsMetricsResponse } from "@/types/returns";

export type { ReturnsMetricsQuery } from "@/lib/queries/returns";

export async function getReturnsMetrics(query: ReturnsMetricsQuery): Promise<ReturnsMetricsResponse> {
  return returnQueries.metrics(query).load(serverApi);
}

export async function getReturnFixes(query: RangeQuery): Promise<ReturnFixesData> {
  return returnQueries.fixes(query).load(serverApi);
}
