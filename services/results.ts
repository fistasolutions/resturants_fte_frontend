/** Decision outcomes (SPEC-067, backend SPEC-063) — server transport. Since SPEC-230
 * the paths, keys and loaders live in `lib/queries/results.ts`; this module is their
 * `serverApi` face. */
import { serverApi } from "@/lib/api";
import { resultQueries } from "@/lib/queries/results";
import type { ManagerAccountability, ReportCard, ResultsData, ValueLedger } from "@/types/results";

export async function getResults(): Promise<ResultsData> {
  return resultQueries.results().load(serverApi);
}

/** The value ledger (backend SPEC-207 / frontend SPEC-188). */
export async function getValueLedger(): Promise<ValueLedger> {
  return resultQueries.ledger().load(serverApi);
}

/** Manager accountability (backend SPEC-248 / frontend SPEC-241). */
export async function getManagers(): Promise<ManagerAccountability> {
  return resultQueries.managers().load(serverApi);
}

export async function getReportCard(locationId: number): Promise<ReportCard> {
  return resultQueries.reportCard(locationId).load(serverApi);
}
