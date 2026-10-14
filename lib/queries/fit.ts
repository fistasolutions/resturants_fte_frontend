/**
 * Fit Intelligence reads (SPEC-306 / backend SPEC-303), through the client cache
 * (SPEC-230). The overview is read whole and narrowed in the browser — every chip,
 * search and page is a view of it, never a round trip.
 */
import {
  toFitOverview,
  toFitStyleDetail,
  type ApiFitOverview,
  type ApiFitStyleDetail,
} from "@/lib/fit-api";
import { defineQuery } from "@/lib/query-def";
import type { FitOverview, FitStyleDetail } from "@/types/fit";

export const FIT_KEY = ["fit"] as const;

export const fitPaths = {
  overview: (): string => "/fit/overview",
  style: (productId: number): string => `/fit/styles/${productId}`,
} as const;

export const fitQueries = {
  overview: () =>
    defineQuery<FitOverview>([...FIT_KEY, "overview"], async (api) =>
      toFitOverview(await api<ApiFitOverview>(fitPaths.overview())),
    ),
  style: (productId: number) =>
    defineQuery<FitStyleDetail>([...FIT_KEY, "style", productId], async (api) =>
      toFitStyleDetail(await api<ApiFitStyleDetail>(fitPaths.style(productId))),
    ),
};
