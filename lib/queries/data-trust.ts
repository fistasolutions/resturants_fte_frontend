/** Catalogue data-trust query (SPEC-217; backend SPEC-225) — defined once for both
 * transports (SPEC-230). Resolves null on failure so the page renders its error state
 * rather than throwing — a broken integrity check must never take down the tab. */
import { adaptDataTrust } from "@/lib/data-trust";
import { defineQuery } from "@/lib/query-def";
import type { DataTrustApiResponse, DataTrustReport } from "@/types/data-trust";

export const dataTrustPaths = { report: (): string => "/analysis/data-trust" } as const;

export const dataTrustQueries = {
  report: () =>
    defineQuery<DataTrustReport | null>(["data-trust", "report"], async (api) => {
      try {
        return adaptDataTrust(await api<DataTrustApiResponse>(dataTrustPaths.report()));
      } catch {
        return null;
      }
    }),
} as const;
