/** Store-traffic queries (backend SPEC-098/113) — defined once for both transports
 * (SPEC-230). Byte-identical paths to the pre-SPEC-230 `services/traffic.ts`. */
import { defineQuery } from "@/lib/query-def";
import type { TrafficOverview, TrafficPeakHours, TrafficStoreDetail } from "@/types/traffic";

export const trafficPaths = {
  overview: (from: string, to: string): string => `/traffic/overview?start=${from}&end=${to}`,
  peakHours: (from: string, to: string): string => `/traffic/peak-hours?start=${from}&end=${to}`,
  storeDetail: (locationId: number, from: string, to: string): string =>
    `/traffic/store/${locationId}?start=${from}&end=${to}`,
} as const;

export const trafficQueries = {
  overview: (from: string, to: string) =>
    defineQuery<TrafficOverview>(["traffic", "overview", { from, to }], (api) =>
      api<TrafficOverview>(trafficPaths.overview(from, to)),
    ),
  peakHours: (from: string, to: string) =>
    defineQuery<TrafficPeakHours>(["traffic", "peak-hours", { from, to }], (api) =>
      api<TrafficPeakHours>(trafficPaths.peakHours(from, to)),
    ),
  storeDetail: (locationId: number, from: string, to: string) =>
    defineQuery<TrafficStoreDetail>(["traffic", "store", locationId, { from, to }], (api) =>
      api<TrafficStoreDetail>(trafficPaths.storeDetail(locationId, from, to)),
    ),
} as const;
