/** Product & inventory analysis service (SPEC-023/024) — server transport. Since
 * SPEC-230 every path, key and loader lives in `lib/queries/analysis.ts` so the
 * client cache refetches the same definitions through `/api/proxy`; this module is
 * their `serverApi` face, contract for contract (including every null-on-failure). */
import { serverApi } from "@/lib/api";
import {
  analysisQueries,
  type AnalysisQuery,
  type InventoryPanel,
  type ProductAiPanel,
} from "@/lib/queries/analysis";
import type {
  BundlesData,
  BuyPlanData,
  CatalogVerdicts,
  ContentGapsData,
  DeadInventoryAlerts,
  DeadStockAged,
  DeadStockPlan,
  InventoryAnalysis,
  InventoryByLocationDashboard,
  InventoryTransfers,
  LocationTransferOpportunities,
  PageCommentary,
  ProductAnalysis,
  ProductDetail,
  ReturnVerdicts,
  TransferEligibleLocation,
  TransferPlan,
  TrueProfitData,
} from "@/types/analysis";

export { analysisApiQuery } from "@/lib/queries/analysis";
export type { AnalysisQuery, InventoryPanel, ProductAiPanel } from "@/lib/queries/analysis";

export async function getProductAnalysis(query: AnalysisQuery): Promise<ProductAnalysis> {
  return analysisQueries.products(query).load(serverApi);
}

/** Single-product detail (SPEC-146). Throws `ApiError` (404 on an unknown id). */
export async function getProductDetail(productId: number, query: AnalysisQuery): Promise<ProductDetail> {
  return analysisQueries.productDetail(productId, query).load(serverApi);
}

export async function getInventoryAnalysis(query: AnalysisQuery): Promise<InventoryAnalysis | null> {
  return analysisQueries.inventory(query).load(serverApi);
}

export async function getProductReturnVerdicts(query: AnalysisQuery): Promise<ReturnVerdicts | null> {
  return analysisQueries.productReturnVerdicts(query).load(serverApi);
}

export async function getInventoryByLocationDashboard(): Promise<InventoryByLocationDashboard | null> {
  return analysisQueries.inventoryByLocation().load(serverApi);
}

export async function getInventoryTransfers(query: AnalysisQuery, page = 1): Promise<InventoryTransfers | null> {
  return analysisQueries.inventoryTransfers(query, page).load(serverApi);
}

export async function getTransferPlan(query: AnalysisQuery): Promise<TransferPlan | null> {
  return analysisQueries.transferPlan(query).load(serverApi);
}

export async function getInventoryCommentary(query: AnalysisQuery): Promise<PageCommentary | null> {
  return analysisQueries.inventoryCommentary(query).load(serverApi);
}

export async function getTransferCommentary(query: AnalysisQuery): Promise<PageCommentary | null> {
  return analysisQueries.transferCommentary(query).load(serverApi);
}

export async function getDeadStockAged(query: AnalysisQuery): Promise<DeadStockAged | null> {
  return analysisQueries.deadStockAged(query).load(serverApi);
}

export async function getDeadStockPlan(opts: { cacheOnly?: boolean } = {}): Promise<DeadStockPlan | null> {
  return analysisQueries.deadStockPlan(opts.cacheOnly ?? false).load(serverApi);
}

export async function getCatalogVerdicts(
  query: AnalysisQuery,
  ids: number[],
  opts: { cacheOnly?: boolean } = {},
): Promise<CatalogVerdicts | null> {
  return analysisQueries.catalogVerdicts(query, ids, opts.cacheOnly ?? false).load(serverApi);
}

export async function getProductCommentary(query: AnalysisQuery): Promise<PageCommentary | null> {
  return analysisQueries.productCommentary(query).load(serverApi);
}

export async function getProductAiPanel(query: AnalysisQuery): Promise<ProductAiPanel> {
  return analysisQueries.productAiPanel(query).load(serverApi);
}

export async function getInventoryPanel(query: AnalysisQuery, transfersPage = 1): Promise<InventoryPanel> {
  return analysisQueries.inventoryPanel(query, transfersPage).load(serverApi);
}

export async function getDeadInventoryAlerts(): Promise<DeadInventoryAlerts | null> {
  return analysisQueries.deadInventoryAlerts().load(serverApi);
}

/** No try/catch — the page needs to tell a 404 (unknown location) apart from a
 * generic fetch failure, same as `getOrderDetail`. */
export async function getLocationTransferOpportunities(locationId: number): Promise<LocationTransferOpportunities> {
  return analysisQueries.locationTransfers(locationId).load(serverApi);
}

export async function getTransferEligibleLocations(): Promise<TransferEligibleLocation[]> {
  return analysisQueries.transferEligibleLocations().load(serverApi);
}

export async function getTrueProfit(query: AnalysisQuery): Promise<TrueProfitData> {
  return analysisQueries.trueProfit(query).load(serverApi);
}

export async function getBuyPlan(query: AnalysisQuery): Promise<BuyPlanData> {
  return analysisQueries.buyPlan(query).load(serverApi);
}

export async function getContentGaps(query: AnalysisQuery): Promise<ContentGapsData> {
  return analysisQueries.contentGaps(query).load(serverApi);
}

export async function getBundles(query: AnalysisQuery): Promise<BundlesData> {
  return analysisQueries.bundles(query).load(serverApi);
}
