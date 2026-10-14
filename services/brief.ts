/**
 * Morning Brief service — server transport (SPEC-017). Since SPEC-230 the paths, keys
 * and loaders live in `lib/queries/brief.ts` so the client cache can refetch the same
 * definitions through `/api/proxy`; this module is the `serverApi` face of them.
 */
import { serverApi } from "@/lib/api";
import { briefQueries, type BriefRangeKpisQuery, type WinbackQuery } from "@/lib/queries/brief";
import type {
  BriefAttention,
  BriefData,
  BriefHistoryList,
  BriefRangeKpisResponse,
  OverdueSheetsResponse,
  TrafficNudgeSheetsResponse,
  TransferSheetsResponse,
  WinbackListResponse,
} from "@/types/brief";

export type { BriefRangeKpisQuery, WinbackQuery } from "@/lib/queries/brief";

export async function getBriefData(query?: BriefRangeKpisQuery): Promise<BriefData> {
  return briefQueries.data(query).load(serverApi);
}

export async function getAttentionData(): Promise<BriefAttention> {
  return briefQueries.attention().load(serverApi);
}

export async function getBriefRangeKpis(
  query: BriefRangeKpisQuery,
): Promise<BriefRangeKpisResponse> {
  return briefQueries.kpis(query).load(serverApi);
}

export async function getTransferSheets(): Promise<TransferSheetsResponse> {
  return briefQueries.transfers().load(serverApi);
}

export async function getOverdueSheets(): Promise<OverdueSheetsResponse> {
  return briefQueries.overdue().load(serverApi);
}

export async function getTrafficNudgeSheets(): Promise<TrafficNudgeSheetsResponse> {
  return briefQueries.traffic().load(serverApi);
}

export async function getWinbackCustomers(query: WinbackQuery = {}): Promise<WinbackListResponse> {
  return briefQueries.winback(query).load(serverApi);
}

export async function getBriefByDate(date: string): Promise<BriefData> {
  return briefQueries.byDate(date).load(serverApi);
}

export async function getBriefHistory(page = 1, limit = 10): Promise<BriefHistoryList> {
  return briefQueries.history(page, limit).load(serverApi);
}
