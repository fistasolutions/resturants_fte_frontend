/**
 * Product & inventory analysis queries (SPEC-023/024; backend SPEC-015/033) — every
 * read `services/analysis.ts` used to make, defined once for both transports
 * (SPEC-230). Paths are byte-identical to the pre-SPEC-230 service, and every
 * "null on failure" contract is preserved: a loader that degraded to null still
 * does, so the page sections that lean on it keep degrading instead of erroring.
 */
import {
  adaptBundles,
  adaptBrandVerdicts,
  adaptBuyPlan,
  adaptContentGaps,
  adaptTrueProfit,
  type ApiBrandVerdicts,
  type ApiBundles,
  type ApiBuyPlan,
  type ApiContentGaps,
  type ApiTrueProfit,
} from "@/lib/adapters";
import { defineQuery, type ApiGet } from "@/lib/query-def";
import type {
  BrandVerdictsData,
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

export interface AnalysisQuery {
  /** ISO dates, inclusive — resolved/clamped by `resolveDateRange`. */
  from: string;
  to: string;
}

/** Query string shared by the analysis fetch and its AI commentary, so the
 * narrative always describes exactly the visible range. */
export function analysisApiQuery({ from, to }: AnalysisQuery): string {
  return `start=${from}&end=${to}`;
}

export interface ProductAiPanel {
  returnVerdicts: ReturnVerdicts | null;
  commentary: PageCommentary | null;
}

export interface InventoryPanel {
  analysis: InventoryAnalysis | null;
  transfers: InventoryTransfers | null;
  deadStockAged: DeadStockAged | null;
}

export const analysisPaths = {
  products: (q: AnalysisQuery): string => `/analysis/products?${analysisApiQuery(q)}`,
  productDetail: (productId: number, q: AnalysisQuery): string =>
    `/analysis/products/${productId}?${analysisApiQuery(q)}`,
  inventory: (q: AnalysisQuery): string => `/analysis/inventory?${analysisApiQuery(q)}`,
  productReturnVerdicts: (q: AnalysisQuery): string =>
    `/analysis/products/return-verdicts?${analysisApiQuery(q)}`,
  inventoryByLocation: (): string => "/analysis/inventory/by-location",
  inventoryTransfers: (q: AnalysisQuery, page: number): string =>
    `/analysis/inventory/transfers?${analysisApiQuery(q)}&page=${page}`,
  transferPlan: (q: AnalysisQuery): string =>
    `/analysis/inventory/transfer-plan?${analysisApiQuery(q)}`,
  inventoryCommentary: (q: AnalysisQuery): string =>
    `/analysis/inventory/commentary?${analysisApiQuery(q)}`,
  transferCommentary: (q: AnalysisQuery): string =>
    `/analysis/inventory/transfers/commentary?${analysisApiQuery(q)}`,
  deadStockAged: (q: AnalysisQuery): string =>
    `/analysis/inventory/dead-stock-aged?${analysisApiQuery(q)}`,
  deadStockPlan: (cacheOnly: boolean): string =>
    `/analysis/inventory/dead-stock-plan${cacheOnly ? "?cache_only=true" : ""}`,
  catalogVerdicts: (q: AnalysisQuery, ids: number[], cacheOnly: boolean): string =>
    `/analysis/products/catalog-verdicts?${analysisApiQuery(q)}&ids=${ids.join(",")}` +
    (cacheOnly ? "&cache_only=true" : ""),
  productCommentary: (q: AnalysisQuery): string =>
    `/analysis/products/commentary?${analysisApiQuery(q)}`,
  productAiPanel: (q: AnalysisQuery): string =>
    `/analysis/products/ai-panel?${analysisApiQuery(q)}`,
  inventoryPanel: (q: AnalysisQuery, transfersPage: number): string =>
    `/analysis/inventory/panel?${analysisApiQuery(q)}&transfers_page=${transfersPage}`,
  deadInventoryAlerts: (): string => "/analysis/inventory/dead-inventory-alerts",
  locationTransfers: (locationId: number): string =>
    `/analysis/inventory/location-transfers/${locationId}`,
  transferLocations: (): string => "/analysis/inventory/transfer-locations",
  trueProfit: (q: AnalysisQuery): string => `/analysis/true-profit?${analysisApiQuery(q)}`,
  buyPlan: (q: AnalysisQuery): string => `/analysis/buy-plan?${analysisApiQuery(q)}`,
  contentGaps: (q: AnalysisQuery): string => `/analysis/content-gaps?${analysisApiQuery(q)}`,
  bundles: (q: AnalysisQuery): string => `/analysis/bundles?${analysisApiQuery(q)}`,
  brandVerdicts: (q: AnalysisQuery): string => `/analysis/brand-verdicts?${analysisApiQuery(q)}`,
} as const;

/** The "null on failure" contract most analysis reads carry. */
async function orNull<T>(api: ApiGet, path: string, label?: string): Promise<T | null> {
  try {
    return await api<T>(path);
  } catch (err) {
    if (label) console.error(`[${label}] failed:`, err);
    return null;
  }
}

/** Misplaced-stock alerts (SPEC-059 / backend SPEC-053) — null on failure. */
export async function loadDeadInventoryAlerts(api: ApiGet): Promise<DeadInventoryAlerts | null> {
  return orNull<DeadInventoryAlerts>(api, analysisPaths.deadInventoryAlerts(), "loadDeadInventoryAlerts");
}

/** Combined AI content for Product Analyst (perf fix): return-verdicts and
 * commentary are both LLM-backed calls, fetched together in one round trip. */
export async function loadProductAiPanel(api: ApiGet, q: AnalysisQuery): Promise<ProductAiPanel> {
  try {
    const data = await api<{ return_verdicts: ReturnVerdicts; commentary: PageCommentary }>(
      analysisPaths.productAiPanel(q),
    );
    return { returnVerdicts: data.return_verdicts, commentary: data.commentary };
  } catch {
    return { returnVerdicts: null, commentary: null };
  }
}

/** Combined plain-SQL data for Inventory Analyst (perf fix): analysis, transfers
 * and dead-stock-aged in one round trip. Commentary stays its own query. */
export async function loadInventoryPanel(
  api: ApiGet,
  q: AnalysisQuery,
  transfersPage = 1,
): Promise<InventoryPanel> {
  try {
    const data = await api<{
      analysis: InventoryAnalysis;
      transfers: InventoryTransfers;
      dead_stock_aged: DeadStockAged;
    }>(analysisPaths.inventoryPanel(q, transfersPage));
    return {
      analysis: data.analysis,
      transfers: data.transfers,
      deadStockAged: data.dead_stock_aged,
    };
  } catch {
    return { analysis: null, transfers: null, deadStockAged: null };
  }
}

/** Per-product catalog verdicts (SPEC-105, backend SPEC-103). Empty `ids`
 * short-circuits (no call); null on failure so cells fall back to a skeleton. */
export async function loadCatalogVerdicts(
  api: ApiGet,
  q: AnalysisQuery,
  ids: number[],
  cacheOnly: boolean,
): Promise<CatalogVerdicts | null> {
  if (ids.length === 0) return { verdicts: [], generated_at: "", stale: false };
  return orNull<CatalogVerdicts>(api, analysisPaths.catalogVerdicts(q, ids, cacheOnly));
}

/** Store Transfers index (SPEC-083, backend SPEC-078) — empty on failure. */
export async function loadTransferEligibleLocations(api: ApiGet): Promise<TransferEligibleLocation[]> {
  try {
    const body = await api<{ locations: TransferEligibleLocation[] }>(analysisPaths.transferLocations());
    return body.locations;
  } catch (err) {
    console.error("[loadTransferEligibleLocations] failed:", err);
    return [];
  }
}

const key = (q: AnalysisQuery) => ({ from: q.from, to: q.to });

export const analysisQueries = {
  products: (q: AnalysisQuery) =>
    defineQuery<ProductAnalysis>(["analysis", "products", key(q)], (api) =>
      api<ProductAnalysis>(analysisPaths.products(q)),
    ),
  /** Throws `ApiError` (404 on an unknown id) so the view can `notFound()`. */
  productDetail: (productId: number, q: AnalysisQuery) =>
    defineQuery<ProductDetail>(["analysis", "product-detail", productId, key(q)], (api) =>
      api<ProductDetail>(analysisPaths.productDetail(productId, q)),
    ),
  inventory: (q: AnalysisQuery) =>
    defineQuery<InventoryAnalysis | null>(["analysis", "inventory", key(q)], (api) =>
      orNull<InventoryAnalysis>(api, analysisPaths.inventory(q), "loadInventoryAnalysis"),
    ),
  productReturnVerdicts: (q: AnalysisQuery) =>
    defineQuery<ReturnVerdicts | null>(["analysis", "product-return-verdicts", key(q)], (api) =>
      orNull<ReturnVerdicts>(api, analysisPaths.productReturnVerdicts(q)),
    ),
  inventoryByLocation: () =>
    defineQuery<InventoryByLocationDashboard | null>(["analysis", "inventory-by-location"], (api) =>
      orNull<InventoryByLocationDashboard>(api, analysisPaths.inventoryByLocation()),
    ),
  inventoryTransfers: (q: AnalysisQuery, page = 1) =>
    defineQuery<InventoryTransfers | null>(["analysis", "inventory-transfers", key(q), page], (api) =>
      orNull<InventoryTransfers>(api, analysisPaths.inventoryTransfers(q, page)),
    ),
  transferPlan: (q: AnalysisQuery) =>
    defineQuery<TransferPlan | null>(["analysis", "transfer-plan", key(q)], (api) =>
      orNull<TransferPlan>(api, analysisPaths.transferPlan(q)),
    ),
  inventoryCommentary: (q: AnalysisQuery) =>
    defineQuery<PageCommentary | null>(["analysis", "inventory-commentary", key(q)], (api) =>
      orNull<PageCommentary>(api, analysisPaths.inventoryCommentary(q)),
    ),
  transferCommentary: (q: AnalysisQuery) =>
    defineQuery<PageCommentary | null>(["analysis", "transfer-commentary", key(q)], (api) =>
      orNull<PageCommentary>(api, analysisPaths.transferCommentary(q)),
    ),
  deadStockAged: (q: AnalysisQuery) =>
    defineQuery<DeadStockAged | null>(["analysis", "dead-stock-aged", key(q)], (api) =>
      orNull<DeadStockAged>(api, analysisPaths.deadStockAged(q)),
    ),
  /** With `cacheOnly` (SPEC-085) the stored plan or null WITHOUT an LLM call. */
  deadStockPlan: (cacheOnly = false) =>
    defineQuery<DeadStockPlan | null>(["analysis", "dead-stock-plan", cacheOnly], (api) =>
      orNull<DeadStockPlan | null>(api, analysisPaths.deadStockPlan(cacheOnly)),
    ),
  catalogVerdicts: (q: AnalysisQuery, ids: number[], cacheOnly = false) =>
    defineQuery<CatalogVerdicts | null>(
      ["analysis", "catalog-verdicts", key(q), ids, cacheOnly],
      (api) => loadCatalogVerdicts(api, q, ids, cacheOnly),
    ),
  productCommentary: (q: AnalysisQuery) =>
    defineQuery<PageCommentary | null>(["analysis", "product-commentary", key(q)], (api) =>
      orNull<PageCommentary>(api, analysisPaths.productCommentary(q)),
    ),
  productAiPanel: (q: AnalysisQuery) =>
    defineQuery<ProductAiPanel>(["analysis", "product-ai-panel", key(q)], (api) =>
      loadProductAiPanel(api, q),
    ),
  inventoryPanel: (q: AnalysisQuery, transfersPage = 1) =>
    defineQuery<InventoryPanel>(["analysis", "inventory-panel", key(q), transfersPage], (api) =>
      loadInventoryPanel(api, q, transfersPage),
    ),
  deadInventoryAlerts: () =>
    defineQuery<DeadInventoryAlerts | null>(["analysis", "dead-inventory-alerts"], loadDeadInventoryAlerts),
  /** No null-on-failure: the page must tell a 404 (unknown location) from a failure. */
  locationTransfers: (locationId: number) =>
    defineQuery<LocationTransferOpportunities>(["analysis", "location-transfers", locationId], (api) =>
      api<LocationTransferOpportunities>(analysisPaths.locationTransfers(locationId)),
    ),
  transferEligibleLocations: () =>
    defineQuery<TransferEligibleLocation[]>(["analysis", "transfer-locations"], loadTransferEligibleLocations),
  /** True Profit per SKU (backend SPEC-204 / frontend SPEC-185). */
  trueProfit: (q: AnalysisQuery) =>
    defineQuery<TrueProfitData>(["analysis", "true-profit", key(q)], async (api) =>
      adaptTrueProfit(await api<ApiTrueProfit>(analysisPaths.trueProfit(q))),
    ),
  /** Size-curve buy plan (backend SPEC-210 / frontend SPEC-211). */
  buyPlan: (q: AnalysisQuery) =>
    defineQuery<BuyPlanData>(["analysis", "buy-plan", key(q)], async (api) =>
      adaptBuyPlan(await api<ApiBuyPlan>(analysisPaths.buyPlan(q))),
    ),
  /** Product content gaps (backend SPEC-212 / frontend SPEC-213). */
  contentGaps: (q: AnalysisQuery) =>
    defineQuery<ContentGapsData>(["analysis", "content-gaps", key(q)], async (api) =>
      adaptContentGaps(await api<ApiContentGaps>(analysisPaths.contentGaps(q))),
    ),
  /** Margin-ranked bundle candidates (backend SPEC-215 / frontend SPEC-191). */
  bundles: (q: AnalysisQuery) =>
    defineQuery<BundlesData>(["analysis", "bundles", key(q)], async (api) =>
      adaptBundles(await api<ApiBundles>(analysisPaths.bundles(q))),
    ),
  /** Brand verdicts (backend SPEC-246 / frontend SPEC-239). */
  brandVerdicts: (q: AnalysisQuery) =>
    defineQuery<BrandVerdictsData>(["analysis", "brand-verdicts", key(q)], async (api) =>
      adaptBrandVerdicts(await api<ApiBrandVerdicts>(analysisPaths.brandVerdicts(q))),
    ),
} as const;
