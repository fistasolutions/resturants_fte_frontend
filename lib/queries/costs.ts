/**
 * Landed cost queries (backend SPEC-256 / frontend SPEC-251) — the Costs tab's one
 * read, defined once for both transports (SPEC-230). Writes (shipments, manual
 * entries, assumptions, refresh) go through `/api/proxy` from the cards and
 * invalidate the `["costs"]` prefix.
 */
import { defineQuery } from "@/lib/query-def";
import type { ApiCostSummary } from "@/types/costs";

export interface CostsQuery {
  /** ISO dates, inclusive. */
  from: string;
  to: string;
}

export const costsPaths = {
  summary: (q: CostsQuery): string => `/costs/summary?start=${q.from}&end=${q.to}`,
  variants: (q: string): string => `/costs/variants?q=${encodeURIComponent(q)}`,
} as const;

export const costsQueries = {
  summary: (q: CostsQuery) =>
    defineQuery<ApiCostSummary>(["costs", "summary", q.from, q.to], async (api) =>
      api<ApiCostSummary>(costsPaths.summary(q)),
    ),
} as const;
