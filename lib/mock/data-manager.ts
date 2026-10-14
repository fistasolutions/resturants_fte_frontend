/**
 * Data Manager example data (SPEC-374). Shown, labelled as an example, until the organization's
 * first import; typed with the shapes the import engine will return. Every name is invented.
 */
import type { DataManagerPreview, SourceTable } from "@/types/data-manager";

const payments: SourceTable = {
  id: "payments",
  name: "Payments",
  origin: "airtable",
  container: "Buying & payments",
  fields: [
    { name: "Date", type: "date" },
    { name: "Card #", type: "select" },
    { name: "Amount", type: "currency" },
    { name: "Vendor", type: "link" },
    { name: "Location", type: "select" },
    { name: "Invoice #", type: "text" },
    { name: "Notes", type: "text" },
    { name: "Verified", type: "checkbox" },
    { name: "Entered into accounting", type: "checkbox" },
  ],
  rowCount: 11,
  rows: [
    ["26/8/2026", "4021", "$1,503.00", "Northline Knits", "Downtown", "40070", "FW26", "✓", ""],
    ["15/9/2026", "4021", "$9,261.00", "Harbor Apparel Co.", "Downtown", "FW26", "FW26 Harbor", "✓", "✓"],
    ["17/9/2026", "4021", "$928.00", "Northline Knits", "Downtown", "39252", "FW26 Northline", "✓", "✓"],
    ["17/9/2026", "4021", "$2,209.31", "Indigo Works", "Downtown", "275", "FW26 Indigo", "✓", "✓"],
    ["26/8/2026", "4021", "$1,503.00", "Northline Knits", "Uptown", "40072", "FW26", "✓", ""],
    ["17/9/2026", "4021", "$2,244.71", "Lumière Textiles", "Uptown", "19277156", "FW26 Lumière", "✓", "✓"],
    ["17/9/2026", "4021", "$2,247.85", "Lumière Textiles", "Uptown", "19277156", "FW26 Lumière", "✓", "✓"],
    ["17/9/2026", "4021", "$928.00", "Northline Knits", "Uptown", "40069", "FW26 Northline", "✓", "✓"],
    ["26/8/2026", "4021", "$1,503.00", "Northline Knits", "Online", "40071", "FW26", "✓", ""],
    ["17/9/2026", "4021", "$2,935.13", "Lumière Textiles", "Online", "19277155", "FW26 Lumière", "✓", ""],
    ["17/9/2026", "4021", "$928.00", "Northline Knits", "Online", "40068", "FW26 Northline", "✓", ""],
  ],
  matchedPct: null,
  readAt: "2026-10-14T06:04:00Z",
};

const balances: SourceTable = {
  id: "balances",
  name: "Supplier Balances",
  origin: "airtable",
  container: "Buying & payments",
  fields: [
    { name: "Name", type: "text" },
    { name: "Deposits", type: "currency" },
    { name: "Balance", type: "currency" },
    { name: "Shipping", type: "currency" },
    { name: "Other", type: "currency" },
    { name: "Total", type: "formula" },
    { name: "Last Modified", type: "date" },
  ],
  rowCount: 6,
  rows: [
    ["Harbor Apparel Co.", "$0.00", "$751,529.00", "$0.00", "$0.00", "$751,529.00", "6/10/2026"],
    ["Lumière Textiles", "$0.00", "$130,457.36", "$0.00", "$0.00", "$130,457.36", "6/10/2026"],
    ["Northline Knits", "$0.00", "$83,090.60", "$0.00", "$0.00", "$83,090.60", "24/9/2026"],
    ["Indigo Works", "$0.00", "$52,594.60", "$0.00", "$0.00", "$52,594.60", "8/10/2026"],
    ["Atelier Small Goods", "$0.00", "$31,573.49", "$0.00", "$0.00", "$31,573.49", "9/10/2026"],
    ["Coastline Shipping", "$0.00", "$0.00", "$0.00", "$0.00", "$0.00", "19/5/2026"],
  ],
  matchedPct: null,
  readAt: "2026-10-14T06:04:00Z",
};

const poLines: SourceTable = {
  id: "po-lines",
  name: "Purchase Order Lines",
  origin: "airtable",
  container: "Buying & payments",
  fields: [
    { name: "Vendor", type: "link" },
    { name: "Order Date", type: "date" },
    { name: "Season", type: "select" },
    { name: "PO Number", type: "text" },
    { name: "Style Code", type: "text" },
    { name: "Description", type: "text" },
    { name: "Color", type: "text" },
    { name: "Qty by Size", type: "text" },
    { name: "Total Qty", type: "number" },
    { name: "Unit Price", type: "currency" },
    { name: "Line Total", type: "currency" },
    { name: "Location", type: "select" },
  ],
  rowCount: 424,
  rows: [
    ["Harbor Apparel Co.", "3/6/2026", "SS27", "00000105", "117218", "ORGANZA SHIRT", "AZ - AZZURRO", "38:1; 40:1; 42:1; 44:1; 46:2", "6", "$171.00", "$1,026.00", "Downtown"],
    ["Harbor Apparel Co.", "3/6/2026", "SS27", "00000105", "117208", "POPLIN ANORAK", "CIE - CIELO", "38:1", "1", "$160.00", "$160.00", "Downtown"],
    ["Harbor Apparel Co.", "3/6/2026", "SS27", "00000105", "117009", "ORGANZA SKIRT", "AZ - AZZURRO", "38:1; 40:1; 42:1; 44:1; 46:2", "6", "$279.00", "$1,674.00", "Downtown"],
    ["Lumière Textiles", "17/6/2026", "SS27", "75013", "CD1C6775CROC", "DRESS 6775 FABRIC CROC", "765 TOBACCO LEAF", "38:1; 40:2; 42:2; 44:1; 46:2", "8", "$188.00", "$1,504.00", "Uptown"],
    ["Lumière Textiles", "17/6/2026", "SS27", "75013", "CD1C6838DAISY", "DRESS 6838 FABRIC DAISY", "1 WHITE", "38:1; 40:2; 42:2; 44:1; 46:2", "8", "$266.00", "$2,128.00", "Uptown"],
    ["Lumière Textiles", "17/6/2026", "SS27", "75013", "CD1C5042SAT161", "SKIRT 5042 FABRIC SATIN", "97 POISED GREEN", "38:1; 40:1; 42:1; 44:1; 46:2", "6", "$222.00", "$1,332.00", "Uptown"],
    ["Northline Knits", "3/6/2026", "SS27", "75005", "CD1C8778COTTON", "SHORT-SLEEVED COTTON TOP", "1 WHITE", "XS:2; S:2; M:1", "5", "$146.00", "$730.00", "Online"],
    ["Northline Knits", "3/6/2026", "SS27", "75005", "CD1C5034EQUO", "WRAP SKIRT WITH MIXED PANELS", "720 CITRUS", "38:1; 40:1; 42:1; 44:1", "4", "$188.00", "$752.00", "Online"],
  ],
  matchedPct: 96,
  readAt: "2026-10-14T06:04:00Z",
};

const shipped: SourceTable = {
  id: "shipped",
  name: "Styles Shipped by Location",
  origin: "airtable",
  container: "Seasons",
  fields: [
    { name: "Style No.", type: "text" },
    { name: "Ordered", type: "number" },
    { name: "Shipped to Downtown", type: "number" },
  ],
  rowCount: 1090,
  rows: [
    ["HA1019", "94", "106"],
    ["HA1019", "94", "104"],
    ["MG823", "46", "46"],
    ["HA1040", "102", "102"],
    ["MG821", "61", "61"],
    ["VR703", "47", "47"],
    ["SR407", "92", "92"],
    ["MEL4032", "163", "163"],
  ],
  matchedPct: 91,
  readAt: "2026-10-14T06:04:00Z",
};

export const DATA_MANAGER_EXAMPLE: DataManagerPreview = {
  bases: [
    { id: "buying", name: "Buying & payments", tableIds: ["payments", "balances", "po-lines"] },
    { id: "seasons", name: "Seasons", tableIds: ["shipped"] },
  ],
  tables: [payments, balances, poLines, shipped],
  meanings: {},
  matches: { bySku: 2786, byBarcode: 147, needsLook: 41, notInShopify: 34 },
  candidates: [
    { sourceValue: "CD1C6838DAIS", product: "Dress 6838 – Daisy", shopifySku: "CD1C6838DAISY", likeness: 92 },
    { sourceValue: "117218-AZ", product: "Organza Shirt – Azzurro", shopifySku: "117218AZ", likeness: 89 },
    { sourceValue: "MEL-4032", product: "Pleated Skirt 4032", shopifySku: "MEL4032", likeness: 84 },
  ],
  profit: {
    realRevenue: 214865,
    realProfit: 141210,
    realMarginPct: 65.7,
    shopifyMarginPct: 73.3,
    costCoveragePct: 98.9,
    variantsWithCost: 2933,
    variants: 2967,
    rows: {
      product: [
        { name: "Dress 6838 – Daisy", unitsKept: 213, realPrice: 113.4, discountPct: 12.1, realCost: 33.43, realRevenue: 24154, realProfit: 17033, realMarginPct: 70.5, shopifyMarginPct: 78.8 },
        { name: "Organza Skirt – Azzurro", unitsKept: 395, realPrice: 71.9, discountPct: 9.0, realCost: 23.1, realRevenue: 28401, realProfit: 19276, realMarginPct: 67.9, shopifyMarginPct: 77.7 },
        { name: "Dress 6775 – Tobacco Leaf", unitsKept: 144, realPrice: 101.2, discountPct: 15.0, realCost: 30.36, realRevenue: 14573, realProfit: 10201, realMarginPct: 70.0, shopifyMarginPct: 78.3 },
        { name: "Short-Sleeved Cotton Top – White", unitsKept: 770, realPrice: 53.1, discountPct: 8.4, realCost: 17.01, realRevenue: 40887, realProfit: 27789, realMarginPct: 68.0, shopifyMarginPct: 73.3 },
        { name: "Satin Skirt 5042 – Poised Green", unitsKept: 187, realPrice: 80.1, discountPct: 10.0, realCost: 24.92, realRevenue: 14979, realProfit: 10319, realMarginPct: 68.9, shopifyMarginPct: 77.5 },
        { name: "Wrap Skirt – Citrus", unitsKept: 217, realPrice: 61.2, discountPct: 15.0, realCost: 19.61, realRevenue: 13280, realProfit: 9025, realMarginPct: 68.0, shopifyMarginPct: 73.4 },
        { name: "Poplin Anorak – Cielo", unitsKept: 506, realPrice: 27.4, discountPct: 5.5, realCost: 7.15, realRevenue: 13864, realProfit: 10246, realMarginPct: 73.9, shopifyMarginPct: 78.5 },
      ],
      vendor: [
        { name: "Lumière Textiles", unitsKept: 544, realPrice: 96.2, discountPct: 12.4, realCost: 29.14, realRevenue: 53706, realProfit: 37553, realMarginPct: 69.9, shopifyMarginPct: 78.2 },
        { name: "Harbor Apparel Co.", unitsKept: 901, realPrice: 74.1, discountPct: 9.6, realCost: 22.9, realRevenue: 66765, realProfit: 46133, realMarginPct: 69.1, shopifyMarginPct: 77.9 },
        { name: "Northline Knits", unitsKept: 987, realPrice: 54.9, discountPct: 9.8, realCost: 17.6, realRevenue: 54167, realProfit: 36796, realMarginPct: 67.9, shopifyMarginPct: 73.4 },
      ],
      location: [
        { name: "Downtown", unitsKept: 1102, realPrice: 71.8, discountPct: 10.2, realCost: 22.4, realRevenue: 79124, realProfit: 54439, realMarginPct: 68.8, shopifyMarginPct: 76.4 },
        { name: "Uptown", unitsKept: 761, realPrice: 74.6, discountPct: 11.1, realCost: 23.1, realRevenue: 56771, realProfit: 39192, realMarginPct: 69.0, shopifyMarginPct: 76.9 },
        { name: "Online", unitsKept: 569, realPrice: 66.9, discountPct: 8.7, realCost: 21.0, realRevenue: 38066, realProfit: 26117, realMarginPct: 68.6, shopifyMarginPct: 75.2 },
      ],
    },
  },
  pending: {
    table: "Purchase Order Lines",
    detectedAt: "2026-10-14T06:04:00Z",
    profitEffect: -3184,
    changes: [
      { key: "CD1C6838DAISY", label: "Dress 6838 – Daisy", field: "Unit Price", was: "$244.00", now: "$266.00", kind: "changed" },
      { key: "CD1C6775CROC", label: "Dress 6775 – Tobacco Leaf", field: "Unit Price", was: "$181.00", now: "$188.00", kind: "changed" },
      { key: "117009", label: "Organza Skirt – Azzurro", field: "Total Qty", was: "4", now: "6", kind: "changed" },
      { key: "CD1C5040CROC", label: "Technical Cotton Wrap", field: "new row", was: "", now: "$165.00 × 4", kind: "added" },
      { key: "117411", label: "Cotton Tee – Latte", field: "row removed", was: "$106.00 × 2", now: "", kind: "removed" },
    ],
  },
  activity: [
    { title: "Read Buying & payments", detail: "3 tables, 441 rows, 5 changed since the last read", at: "2026-10-14T06:04:00Z" },
    { title: "Matched new style codes", detail: "41 rows matched by barcode", at: "2026-10-14T05:10:00Z" },
    { title: "Copied an uploaded sheet", detail: "Freight invoices, 46 rows", at: "2026-10-13T15:22:00Z" },
  ],
};
