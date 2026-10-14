/** Warehouse packing service — server transport (backend SPEC-097). Since SPEC-230
 * the paths, keys and loaders live in `lib/queries/warehouse.ts`; this module is
 * their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { warehouseQueries } from "@/lib/queries/warehouse";
import type {
  BacklogBucket,
  BacklogOrders,
  PackerOrders,
  WarehouseOverview,
} from "@/types/warehouse";

export function getWarehouseOverview({
  from,
  to,
}: {
  from: string;
  to: string;
}): Promise<WarehouseOverview> {
  return warehouseQueries.overview(from, to).load(serverApi);
}

export function getPackerOrders(
  packer: string,
  { from, to }: { from: string; to: string },
): Promise<PackerOrders> {
  return warehouseQueries.packerOrders(packer, from, to).load(serverApi);
}

export function getBacklogOrders({
  bucket = "all",
  limit = 500,
}: {
  bucket?: BacklogBucket;
  limit?: number;
}): Promise<BacklogOrders> {
  return warehouseQueries.backlogOrders(bucket, limit).load(serverApi);
}
