/**
 * SPEC-306 — the Fit tab's page logic and adapters.
 *
 * The page shows figures the backend decided; these tests hold the parts that could still
 * mislead: a missing rate becoming 0, a filter dropping styles, a sort putting a missing
 * figure on top, a copied guide saying more than the page.
 */
import { describe, expect, it } from "vitest";

import { toFitOverview, toFitStyleDetail, type ApiFitStyle } from "@/lib/fit-api";
import {
  DEFAULT_VIEW,
  countFor,
  coverageLabel,
  filterStyles,
  fitHref,
  fitStyleHref,
  guideText,
  leanSplit,
  normalizeVerdictFilter,
  pageOf,
  sortStyles,
  sortedBy,
  viewFromParams,
} from "@/lib/fit";
import type { FitStyle } from "@/types/fit";

const RAW: ApiFitStyle = {
  product_id: 7,
  title: "Mini Pleat Yoke Dress - Black",
  vendor: "Hailey",
  vendor_key: "hailey",
  image_url: null,
  sold: 86,
  returned: 20,
  small: 13,
  large: 4,
  fit_returns: 17,
  fit_rate: 0.1977,
  lean: 0.7647,
  verdict: "runs_small",
  confidence: "medium",
  fit_refund: 3641.63,
  exchanges_up: 4,
  exchanges_down: 0,
};

function style(over: Partial<FitStyle>): FitStyle {
  return {
    productId: 1,
    title: "A",
    vendor: "Meli",
    vendorKey: "meli",
    imageUrl: null,
    sold: 10,
    returned: 2,
    small: 1,
    large: 1,
    fitReturns: 2,
    fitRate: 0.2,
    lean: 0.5,
    verdict: "not_enough",
    confidence: null,
    fitRefund: 20,
    exchangesUp: 0,
    exchangesDown: 0,
    ...over,
  };
}

const STYLES: FitStyle[] = [
  style({ productId: 1, title: "Skirt", verdict: "runs_small", fitRefund: 300, vendorKey: "hailey", vendor: "Hailey" }),
  style({ productId: 2, title: "Dress", verdict: "runs_large", fitRefund: 500 }),
  style({ productId: 3, title: "Blouse", verdict: "not_enough", fitRefund: 50, fitRate: null }),
  style({ productId: 4, title: "Tee", verdict: "inconsistent", fitRefund: 100, vendorKey: "hailey", vendor: "Hailey" }),
];

describe("adapters", () => {
  it("map a style and keep unknowns null", () => {
    const overview = toFitOverview({
      summary: {
        returns: 10, fit_returns: 7, fit_share: 0.7, small: 4, large: 3, fit_refund: 700,
        store_fit_rate: null, styles: 1, styles_judged: 1, runs_small: 1, runs_large: 0,
        true_to_size: 0, inconsistent: 0, not_enough: 0,
      },
      vendors: [],
      styles: [RAW, { ...RAW, product_id: 8, fit_rate: null, confidence: null, verdict: "not_enough" }],
      coverage: { start: "2026-05-21", end: "2026-09-25" },
      rules: { min_fit_returns: 5, size_min_returns: 4 },
    });
    expect(overview.styles[0]).toMatchObject({ productId: 7, fitReturns: 17, exchangesUp: 4, verdict: "runs_small" });
    expect(overview.styles[1].fitRate).toBeNull();
    expect(overview.styles[1].confidence).toBeNull();
    expect(overview.summary.storeFitRate).toBeNull();
    expect(overview.rules).toEqual({ minFitReturns: 5, sizeMinReturns: 4 });
  });

  it("a style page keeps its guide and per-size advice", () => {
    const detail = toFitStyleDetail({
      ...RAW,
      handle: "mini-pleat",
      sizes: [{ size: "S", sold: 20, small: 6, large: 0, fit_rate: 0.3, lean: 1, advice: "Order M" }],
      guide: { headline: "Runs small — order one size up", reason: "13 of 17 said too small.", sizes: [{ size: "S", advice: "Order M" }] },
      vendor_profile: null,
      store_fit_rate: 0.0229,
      coverage: { start: "2026-05-21", end: "2026-09-25" },
    });
    expect(detail.sizes[0]).toEqual({ size: "S", sold: 20, small: 6, large: 0, fitRate: 0.3, lean: 1, advice: "Order M" });
    expect(detail.vendorProfile).toBeNull();
    expect(detail.handle).toBe("mini-pleat");
  });
});

describe("the view in the URL", () => {
  it("defaults to styles with a verdict, most money first", () => {
    expect(viewFromParams(new URLSearchParams())).toEqual(DEFAULT_VIEW);
    expect(fitHref(DEFAULT_VIEW)).toBe("/products/fit");
  });

  it("round-trips every part and drops the defaults", () => {
    const view = { verdict: "runs_small" as const, vendor: "hailey", q: " skirt ", sort: "fitRate" as const, dir: 1 as const, page: 3 };
    const href = fitHref(view);
    expect(href).toBe("/products/fit?verdict=runs_small&vendor=hailey&q=skirt&sort=fitRate&dir=asc&page=3");
    expect(viewFromParams(new URLSearchParams(href.split("?")[1]))).toEqual({ ...view, q: "skirt" });
  });

  it("ignores values it does not know", () => {
    expect(normalizeVerdictFilter("bogus")).toBe("judged");
    expect(viewFromParams(new URLSearchParams("sort=hack&page=-4"))).toMatchObject({ sort: "fitRefund", page: 1 });
  });

  it("a second press on a column flips it; a new column starts in its natural order", () => {
    expect(sortedBy(DEFAULT_VIEW, "fitRefund").dir).toBe(1);
    expect(sortedBy(DEFAULT_VIEW, "title")).toMatchObject({ sort: "title", dir: 1, page: 1 });
    expect(sortedBy(DEFAULT_VIEW, "sold")).toMatchObject({ sort: "sold", dir: -1 });
    expect(fitStyleHref(42)).toBe("/products/fit/42");
  });
});

describe("narrowing and ordering", () => {
  it("counts each chip over what the vendor filter leaves", () => {
    expect(countFor(STYLES, "judged")).toBe(3);
    expect(countFor(STYLES, "all")).toBe(4);
    expect(countFor(STYLES, "not_enough")).toBe(1);
  });

  it("filters by verdict, vendor and search together", () => {
    const view = { ...DEFAULT_VIEW, vendor: "hailey" };
    expect(filterStyles(STYLES, view).map((s) => s.productId)).toEqual([1, 4]);
    expect(filterStyles(STYLES, { ...DEFAULT_VIEW, q: "DRESS" }).map((s) => s.productId)).toEqual([2]);
    expect(filterStyles(STYLES, { ...DEFAULT_VIEW, verdict: "all" })).toHaveLength(4);
  });

  it("sorts by money, keeps ties stable and sinks a missing rate", () => {
    expect(sortStyles(STYLES, "fitRefund", -1).map((s) => s.productId)).toEqual([2, 1, 4, 3]);
    expect(sortStyles(STYLES, "fitRate", -1).at(-1)?.productId).toBe(3);
    expect(sortStyles(STYLES, "fitRate", 1).at(-1)?.productId).toBe(3);
    expect(sortStyles(STYLES, "title", 1).map((s) => s.title)).toEqual(["Blouse", "Dress", "Skirt", "Tee"]);
  });

  it("pages at 25 and clamps an out-of-range page", () => {
    const rows = Array.from({ length: 60 }, (_, i) => i);
    expect(pageOf(rows, 1)).toMatchObject({ page: 1, pages: 3 });
    expect(pageOf(rows, 9).rows).toEqual(rows.slice(50));
  });
});

describe("words and numbers", () => {
  it("splits the lean into two percentages that add to 100", () => {
    expect(leanSplit(13, 4)).toEqual({ small: 76, large: 24 });
    expect(leanSplit(0, 0)).toBeNull();
  });

  it("says what the verdicts rest on", () => {
    expect(coverageLabel("2026-05-21")).toBe("since 21 May 2026");
    expect(coverageLabel(null)).toBe("no returns yet");
  });

  it("copies exactly the guide the page shows", () => {
    expect(
      guideText({
        title: "Mini Pleat Yoke Dress",
        guide: {
          headline: "Runs small — order one size up",
          reason: "13 of 17 customers who returned it for fit said it was too small.",
          sizes: [{ size: "S", advice: "Order M" }],
        },
      }),
    ).toBe(
      "Mini Pleat Yoke Dress — Runs small — order one size up\n" +
        "13 of 17 customers who returned it for fit said it was too small.\n\nBy size:\nS: Order M",
    );
    expect(guideText({ title: "T", guide: { headline: "H", reason: "R", sizes: [] } })).toBe("T — H\nR");
  });
});
