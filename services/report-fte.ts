/**
 * Report FTE service — server transport (SPEC-285). The reads are defined in
 * `lib/queries/report-fte.ts`; this is their `serverApi` face, per the SPEC-230
 * convention. Writes are client-side in `services/report-fte-actions.ts`.
 */
import { serverApi } from "@/lib/api";
import { reportFteQueries } from "@/lib/queries/report-fte";
import type { ComposerData, DeskData, HistoryData, ProfileData, TemplatesData } from "@/types/report-fte";

export async function getReportFteDesk(): Promise<DeskData> {
  return reportFteQueries.desk().load(serverApi);
}

export async function getReportFteRun(runId: number): Promise<ComposerData> {
  return reportFteQueries.composer(runId).load(serverApi);
}

export async function getReportFteTemplates(): Promise<TemplatesData> {
  return reportFteQueries.templates().load(serverApi);
}

export async function getReportFteHistory(): Promise<HistoryData> {
  return reportFteQueries.history().load(serverApi);
}

export async function getReportFteProfile(): Promise<ProfileData> {
  return reportFteQueries.profile().load(serverApi);
}
