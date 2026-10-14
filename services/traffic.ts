/** Store-traffic service — server transport. Since SPEC-230 the paths, keys and
 * loaders live in `lib/queries/traffic.ts`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { trafficQueries } from "@/lib/queries/traffic";
import type { TrafficOverview, TrafficPeakHours, TrafficStoreDetail } from "@/types/traffic";

export function getTrafficStoreDetail({
  locationId,
  from,
  to,
}: {
  locationId: number;
  from: string;
  to: string;
}): Promise<TrafficStoreDetail> {
  return trafficQueries.storeDetail(locationId, from, to).load(serverApi);
}

export function getTrafficOverview({ from, to }: { from: string; to: string }): Promise<TrafficOverview> {
  return trafficQueries.overview(from, to).load(serverApi);
}

export function getTrafficPeakHours({ from, to }: { from: string; to: string }): Promise<TrafficPeakHours> {
  return trafficQueries.peakHours(from, to).load(serverApi);
}
