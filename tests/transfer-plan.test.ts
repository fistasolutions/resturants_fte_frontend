import { describe, expect, it } from "vitest";

import {
  destinationLabel,
  directionLabel,
  rowActionHref,
  rowActionLabel,
} from "@/lib/transfer-plan";
import type { TransferPlanRow } from "@/types/analysis";

const warehouseRow: TransferPlanRow = {
  direction: "warehouse_to_store",
  product_id: 1,
  title: "Dress A",
  from_location: "MILL warehouse",
  to_location: null,
  to_location_id: null,
  suggested_units: 120,
  opportunity_value: 4800,
  urgency: "critical",
  reason: "Store out of stock · 400 idle in MILL warehouse",
  sendable: false,
};

const storeRow: TransferPlanRow = {
  direction: "store_to_store",
  product_id: 2,
  title: "Pleated Skirt",
  from_location: "Lawrence",
  to_location: "Jackson",
  to_location_id: 9102,
  suggested_units: 14,
  opportunity_value: 966,
  urgency: null,
  reason: "Dead 44d at Lawrence · selling at Jackson",
  sendable: false,
};

describe("directionLabel", () => {
  it("labels each direction", () => {
    expect(directionLabel("warehouse_to_store")).toBe("Warehouse → Store");
    expect(directionLabel("store_to_store")).toBe("Store → Store");
  });
});

describe("destinationLabel", () => {
  it("shows 'Stores' for the aggregate warehouse destination", () => {
    expect(destinationLabel(warehouseRow)).toBe("Stores");
  });
  it("shows the destination store name for store→store", () => {
    expect(destinationLabel(storeRow)).toBe("Jackson");
  });
});

describe("rowActionHref", () => {
  it("sends warehouse rows to the inventory transfer review/send", () => {
    expect(rowActionHref(warehouseRow)).toBe("/inventory/transfers/review");
  });
  it("sends store→store rows to the destination store drill-down", () => {
    expect(rowActionHref(storeRow)).toBe("/inventory/store-transfers/9102");
  });
});

describe("rowActionLabel", () => {
  it("labels the warehouse action", () => {
    expect(rowActionLabel(warehouseRow)).toBe("Review & send →");
  });
  it("names the destination store in the store→store action", () => {
    expect(rowActionLabel(storeRow)).toBe("Review at Jackson →");
  });
});
