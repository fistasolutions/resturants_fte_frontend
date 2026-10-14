import { describe, expect, it } from "vitest";

import {
  bodyRows,
  dataTabHref,
  gapTone,
  guessFieldType,
  headerFields,
  isPreviewable,
  normalizeDataTab,
  parseDelimited,
  suggestMeaning,
} from "@/lib/data-manager";

describe("Data Manager tabs (SPEC-374)", () => {
  it("opens on Overview and falls back to it for an unknown tab", () => {
    expect(normalizeDataTab(null)).toBe("overview");
    expect(normalizeDataTab("nope")).toBe("overview");
    expect(normalizeDataTab("profit")).toBe("profit");
  });

  it("links a tab, with extra parameters", () => {
    expect(dataTabHref("overview")).toBe("/data-manager");
    expect(dataTabHref("tables", { table: "po-lines" })).toBe("/data-manager?tab=tables&table=po-lines");
  });
});

describe("reading a sheet into an exact copy", () => {
  it("keeps every character as written: zeros, decimals, a lone dot, spaces", () => {
    const rows = parseDelimited('Code,Price,Note\n00123,12.50,.\n007, 3.10 ,"a, b"\n');
    expect(rows).toEqual([
      ["Code", "Price", "Note"],
      ["00123", "12.50", "."],
      ["007", " 3.10 ", "a, b"],
    ]);
  });

  it("unwraps quotes, keeps doubled quotes and line breaks inside a quoted cell", () => {
    expect(parseDelimited('A,B\n"say ""hi""","line 1\nline 2"')).toEqual([
      ["A", "B"],
      ['say "hi"', "line 1\nline 2"],
    ]);
  });

  it("detects tab and semicolon sheets, and strips a byte-order mark", () => {
    expect(parseDelimited("﻿A\tB\n1\t2")).toEqual([["A", "B"], ["1", "2"]]);
    expect(parseDelimited("A;B\n1,5;2")).toEqual([["A", "B"], ["1,5", "2"]]);
  });

  it("drops blank lines, handles Windows line ends", () => {
    expect(parseDelimited("A,B\r\n1,2\r\n\r\n3,4\r\n")).toEqual([["A", "B"], ["1", "2"], ["3", "4"]]);
  });

  it("names a blank header and pads short rows so no cell is lost", () => {
    const rows = parseDelimited("Style,,Qty\nHA1019,x,94\nMG823");
    const fields = headerFields(rows);
    expect(fields.map((f) => f.name)).toEqual(["Style", "Column 2", "Qty"]);
    expect(bodyRows(rows, fields.length)).toEqual([["HA1019", "x", "94"], ["MG823", "", ""]]);
  });

  it("guesses a display type without converting the value", () => {
    expect(guessFieldType([["$171.00"], ["$1,026.00"]], 0)).toBe("currency");
    expect(guessFieldType([["14.9%"], ["8%"]], 0)).toBe("percent");
    expect(guessFieldType([["94"], ["1,090"]], 0)).toBe("number");
    expect(guessFieldType([["00000105"], ["75013"]], 0)).toBe("text");
    expect(guessFieldType([["26/8/2026"], ["3/6/2026"]], 0)).toBe("date");
    expect(guessFieldType([[""], [""]], 0)).toBe("text");
  });

  it("reads CSV and TSV in the browser and leaves the rest to the import engine", () => {
    expect(isPreviewable("po.csv")).toBe(true);
    expect(isPreviewable("po.TSV")).toBe(true);
    expect(isPreviewable("invoice.pdf")).toBe(false);
    expect(isPreviewable("costing.xlsx")).toBe(false);
  });
});

describe("what a column means", () => {
  it("suggests a meaning from the column name", () => {
    expect(suggestMeaning("Style Code").meaning).toBe("style");
    expect(suggestMeaning("SKU").meaning).toBe("sku");
    expect(suggestMeaning("Unit Price").meaning).toBe("unit_cost");
    expect(suggestMeaning("Qty by Size").meaning).toBe("size_breakdown");
    expect(suggestMeaning("Total Qty").meaning).toBe("quantity");
    expect(suggestMeaning("PO Number").meaning).toBe("po_number");
    expect(suggestMeaning("Vendor").meaning).toBe("vendor");
    expect(suggestMeaning("Invoice #").meaning).toBe("invoice_number");
    expect(suggestMeaning("Line Total").meaning).toBe("amount");
    expect(suggestMeaning("Anything else").meaning).toBe("ignore");
  });

  it("tones the margin gap", () => {
    expect(gapTone(9)).toBe("destructive");
    expect(gapTone(6)).toBe("warning");
    expect(gapTone(2)).toBe("neutral");
  });
});
