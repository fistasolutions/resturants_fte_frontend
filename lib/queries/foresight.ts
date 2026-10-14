/** Foresight queries (backend SPEC-176–183, Launch Watch SPEC-192) — defined once for
 * both transports (SPEC-230). Byte-identical paths to `services/foresight.ts`. */
import { adaptLaunchWatch, type ApiLaunchWatch } from "@/lib/adapters";
import { defineQuery } from "@/lib/query-def";
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

export interface ForesightQuery {
  from: string;
  to: string;
}

export const foresightPaths = {
  profit: ({ from, to }: ForesightQuery): string => `/foresight/profit?start=${from}&end=${to}`,
  forecast: (): string => "/foresight/forecast",
  sizes: ({ from, to }: ForesightQuery): string => `/foresight/sizes?start=${from}&end=${to}`,
  stockout: (): string => "/foresight/stockout",
  stockoutAccuracy: (): string => "/foresight/stockout/accuracy",
  season: (): string => "/foresight/season",
  seasonAccuracy: (): string => "/foresight/season/accuracy",
  launchWatch: (watchDays: number): string => `/analysis/launch-watch?watch_days=${watchDays}`,
} as const;

export const foresightQueries = {
  profit: (query: ForesightQuery) =>
    defineQuery<ProfitLens>(["foresight", "profit", { ...query }], (api) =>
      api<ProfitLens>(foresightPaths.profit(query)),
    ),
  forecast: () =>
    defineQuery<ForecastPace>(["foresight", "forecast"], (api) =>
      api<ForecastPace>(foresightPaths.forecast()),
    ),
  sizes: (query: ForesightQuery) =>
    defineQuery<SizeIntelligence>(["foresight", "sizes", { ...query }], (api) =>
      api<SizeIntelligence>(foresightPaths.sizes(query)),
    ),
  stockout: () =>
    defineQuery<StockoutBoard>(["foresight", "stockout"], (api) =>
      api<StockoutBoard>(foresightPaths.stockout()),
    ),
  stockoutAccuracy: () =>
    defineQuery<StockoutAccuracy>(["foresight", "stockout-accuracy"], (api) =>
      api<StockoutAccuracy>(foresightPaths.stockoutAccuracy()),
    ),
  season: () =>
    defineQuery<SeasonRadar>(["foresight", "season"], (api) =>
      api<SeasonRadar>(foresightPaths.season()),
    ),
  seasonAccuracy: () =>
    defineQuery<SeasonAccuracy>(["foresight", "season-accuracy"], (api) =>
      api<SeasonAccuracy>(foresightPaths.seasonAccuracy()),
    ),
  launchWatch: (watchDays = 45) =>
    defineQuery<LaunchWatchData>(["foresight", "launch-watch", watchDays], async (api) =>
      adaptLaunchWatch(await api<ApiLaunchWatch>(foresightPaths.launchWatch(watchDays))),
    ),
} as const;
