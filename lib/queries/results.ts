/** Decision-outcome queries (SPEC-067, backend SPEC-063; value ledger backend SPEC-207 /
 * frontend SPEC-188; manager accountability backend SPEC-248 / frontend SPEC-241) —
 * defined once for both transports (SPEC-230). */
import {
  adaptManagers,
  adaptReportCard,
  adaptResults,
  adaptValueLedger,
  type ApiManagerAccountability,
  type ApiReportCard,
  type ApiResults,
  type ApiValueLedger,
} from "@/lib/adapters";
import { defineQuery } from "@/lib/query-def";
import type { ManagerAccountability, ReportCard, ResultsData, ValueLedger } from "@/types/results";

export const resultPaths = {
  results: (): string => "/results",
  ledger: (): string => "/results/ledger",
  managers: (): string => "/results/managers",
  reportCard: (locationId: number): string =>
    `/results/managers/report-card?location_id=${locationId}`,
  reportCardSend: (): string => "/results/managers/report-card/send",
} as const;

export const resultQueries = {
  results: () =>
    defineQuery<ResultsData>(["results", "outcomes"], async (api) =>
      adaptResults(await api<ApiResults>(resultPaths.results())),
    ),
  ledger: () =>
    defineQuery<ValueLedger>(["results", "ledger"], async (api) =>
      adaptValueLedger(await api<ApiValueLedger>(resultPaths.ledger())),
    ),
  /** Who was told, who acted (SPEC-241). */
  managers: () =>
    defineQuery<ManagerAccountability>(["results", "managers"], async (api) =>
      adaptManagers(await api<ApiManagerAccountability>(resultPaths.managers())),
    ),
  /** One store's Monday card, as the manager would receive it (SPEC-241). */
  reportCard: (locationId: number) =>
    defineQuery<ReportCard>(["results", "report-card", locationId], async (api) =>
      adaptReportCard(await api<ApiReportCard>(resultPaths.reportCard(locationId))),
    ),
} as const;
