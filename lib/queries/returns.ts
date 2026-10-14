/** Returns queries — Loop team metrics (SPEC-076), Returns Intelligence (SPEC-087)
 * and return fixes — defined once for both transports (SPEC-230). Byte-identical
 * paths to `services/returns.ts` and `services/returns-intel.ts`. */
import { adaptReturnFixes, type ApiReturnFixes } from "@/lib/adapters";
import type { BracketingData } from "@/types/bracketing";
import type { CompareMode } from "@/lib/date-range";
import { toBracketing, type ApiBracketing } from "@/lib/bracketing-api";
import { defineQuery } from "@/lib/query-def";
import type { ReturnFixesData } from "@/types/analysis";
import type { ReturnsMetricsResponse } from "@/types/returns";
import type {
  ByCategoryResponse,
  ByStyleResponse,
  BySizeResponse,
  ReturnsOverview,
  StyleDetail,
} from "@/types/returns-intel";

export interface RangeQuery {
  from: string;
  to: string;
}

export interface ReturnsMetricsQuery extends RangeQuery {
  compare: CompareMode;
}

const range = ({ from, to }: RangeQuery) => `start=${from}&end=${to}`;
const key = ({ from, to }: RangeQuery) => ({ from, to });

export const returnPaths = {
  metrics: ({ from, to, compare }: ReturnsMetricsQuery): string =>
    `/loop/metrics?start=${from}&end=${to}&compare=${compare}`,
  fixes: (q: RangeQuery): string => `/analysis/return-fixes?${range(q)}`,
  overview: (q: RangeQuery): string => `/loop/returns/overview?${range(q)}`,
  byStyle: (q: RangeQuery): string => `/loop/returns/by-style?${range(q)}`,
  bySize: (q: RangeQuery): string => `/loop/returns/by-size?${range(q)}`,
  byCategory: (q: RangeQuery): string => `/loop/returns/by-category?${range(q)}`,
  styleDetail: (productId: number, q: RangeQuery): string =>
    `/loop/returns/style/${productId}?${range(q)}`,
  bracketing: (q: RangeQuery): string => `/returns/bracketing?${range(q)}`,
} as const;

export const returnQueries = {
  metrics: (q: ReturnsMetricsQuery) =>
    defineQuery<ReturnsMetricsResponse>(["returns", "metrics", { ...key(q), compare: q.compare }], (api) =>
      api<ReturnsMetricsResponse>(returnPaths.metrics(q)),
    ),
  fixes: (q: RangeQuery) =>
    defineQuery<ReturnFixesData>(["returns", "fixes", key(q)], async (api) =>
      adaptReturnFixes(await api<ApiReturnFixes>(returnPaths.fixes(q))),
    ),
  overview: (q: RangeQuery) =>
    defineQuery<ReturnsOverview>(["returns", "overview", key(q)], (api) =>
      api<ReturnsOverview>(returnPaths.overview(q)),
    ),
  byStyle: (q: RangeQuery) =>
    defineQuery<ByStyleResponse>(["returns", "by-style", key(q)], (api) =>
      api<ByStyleResponse>(returnPaths.byStyle(q)),
    ),
  bySize: (q: RangeQuery) =>
    defineQuery<BySizeResponse>(["returns", "by-size", key(q)], (api) =>
      api<BySizeResponse>(returnPaths.bySize(q)),
    ),
  byCategory: (q: RangeQuery) =>
    defineQuery<ByCategoryResponse>(["returns", "by-category", key(q)], (api) =>
      api<ByCategoryResponse>(returnPaths.byCategory(q)),
    ),
  styleDetail: (productId: number, q: RangeQuery) =>
    defineQuery<StyleDetail>(["returns", "style", productId, key(q)], (api) =>
      api<StyleDetail>(returnPaths.styleDetail(productId, q)),
    ),
  /** Bracketing (SPEC-309 / backend SPEC-306) — orders holding one style in several sizes. */
  bracketing: (q: RangeQuery) =>
    defineQuery<BracketingData>(["returns", "bracketing", key(q)], async (api) =>
      toBracketing(await api<ApiBracketing>(returnPaths.bracketing(q))),
    ),
} as const;
