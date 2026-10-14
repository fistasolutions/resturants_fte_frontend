/** Foresight service — server transport. Since SPEC-230 the paths, keys and loaders
 * live in `lib/queries/foresight.ts`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { foresightQueries, type ForesightQuery } from "@/lib/queries/foresight";
import type { LaunchWatchData } from "@/types/analysis";
import type {
  ForecastPace,
  ProfitLens,
  SeasonAccuracy,
  SeasonRadar,
  SizeIntelligence,
  StockoutAccuracy,
  StockoutBoard,
} from "@/types/foresight";

export type { ForesightQuery } from "@/lib/queries/foresight";

export async function getProfitLens(query: ForesightQuery): Promise<ProfitLens> {
  return foresightQueries.profit(query).load(serverApi);
}

export async function getForecast(): Promise<ForecastPace> {
  return foresightQueries.forecast().load(serverApi);
}

export async function getSizeIntelligence(query: ForesightQuery): Promise<SizeIntelligence> {
  return foresightQueries.sizes(query).load(serverApi);
}

export async function getStockoutBoard(): Promise<StockoutBoard> {
  return foresightQueries.stockout().load(serverApi);
}

export async function getStockoutAccuracy(): Promise<StockoutAccuracy> {
  return foresightQueries.stockoutAccuracy().load(serverApi);
}

export async function getSeasonRadar(): Promise<SeasonRadar> {
  return foresightQueries.season().load(serverApi);
}

export async function getSeasonAccuracy(): Promise<SeasonAccuracy> {
  return foresightQueries.seasonAccuracy().load(serverApi);
}

export async function getLaunchWatch(watchDays = 45): Promise<LaunchWatchData> {
  return foresightQueries.launchWatch(watchDays).load(serverApi);
}
