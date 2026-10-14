/** Returns Intelligence (SPEC-087) — server transport. Since SPEC-230 the paths,
 * keys and loaders live in `lib/queries/returns.ts`; this module is their
 * `serverApi` face. */
import { serverApi } from "@/lib/api";
import { returnQueries, type RangeQuery } from "@/lib/queries/returns";
import type {
  ByCategoryResponse,
  ByStyleResponse,
  BySizeResponse,
  ReturnsOverview,
  StyleDetail,
} from "@/types/returns-intel";

export function getReturnsOverview(q: RangeQuery): Promise<ReturnsOverview> {
  return returnQueries.overview(q).load(serverApi);
}

export function getReturnsByStyle(q: RangeQuery): Promise<ByStyleResponse> {
  return returnQueries.byStyle(q).load(serverApi);
}

export function getReturnsBySize(q: RangeQuery): Promise<BySizeResponse> {
  return returnQueries.bySize(q).load(serverApi);
}

export function getReturnsByCategory(q: RangeQuery): Promise<ByCategoryResponse> {
  return returnQueries.byCategory(q).load(serverApi);
}

export function getStyleDetail(productId: number, q: RangeQuery): Promise<StyleDetail> {
  return returnQueries.styleDetail(productId, q).load(serverApi);
}
