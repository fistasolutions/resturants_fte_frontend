/** Warehouse packing queries (backend SPEC-097) — defined once for both transports
 * (SPEC-230). Byte-identical paths to the pre-SPEC-230 `services/warehouse.ts`. */
import { defineQuery } from "@/lib/query-def";
import type {
  BacklogBucket,
  BacklogOrders,
  PackerOrders,
  WarehouseOverview,
} from "@/types/warehouse";

export const warehousePaths = {
  overview: (from: string, to: string): string =>
    `/warehouse/overview?start=${from}&end=${to}`,
  packerOrders: (packer: string, from: string, to: string): string =>
    `/warehouse/packers/${encodeURIComponent(packer)}/orders?start=${from}&end=${to}`,
  backlogOrders: (bucket: BacklogBucket, limit: number): string =>
    `/warehouse/backlog/orders?bucket=${bucket}&limit=${limit}`,
} as const;

export const warehouseQueries = {
  overview: (from: string, to: string) =>
    defineQuery<WarehouseOverview>(["warehouse", "overview", { from, to }], (api) =>
      api<WarehouseOverview>(warehousePaths.overview(from, to)),
    ),
  packerOrders: (packer: string, from: string, to: string) =>
    defineQuery<PackerOrders>(["warehouse", "packer-orders", packer, { from, to }], (api) =>
      api<PackerOrders>(warehousePaths.packerOrders(packer, from, to)),
    ),
  backlogOrders: (bucket: BacklogBucket = "all", limit = 500) =>
    defineQuery<BacklogOrders>(["warehouse", "backlog-orders", bucket, limit], (api) =>
      api<BacklogOrders>(warehousePaths.backlogOrders(bucket, limit)),
    ),
} as const;
