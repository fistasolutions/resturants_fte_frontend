import { describe, expect, it } from "vitest";

import {
  adaptAlerts,
  adaptChannels,
  adaptDashboardKpis,
  adaptNetSales,
  adaptCannibalisation,
  adaptReturnFixes,
  adaptValueLedger,
  adaptLaunchWatch,
  adaptWhatChanged,
  adaptTrueProfit,
  adaptOrderDetail,
  adaptRecentOrder,
  adaptResults,
  adaptReturnsSpikeTop,
  adaptRevenueSeries,
  toOrderStatus,
  type ApiOrderDetail,
  type ApiResults,
} from "@/lib/adapters";

describe("toOrderStatus", () => {
  it("maps financial statuses to view statuses", () => {
    expect(toOrderStatus("paid")).toBe("paid");
    expect(toOrderStatus("refunded")).toBe("refunded");
    expect(toOrderStatus("partially_refunded")).toBe("refunded");
    expect(toOrderStatus("pending")).toBe("pending");
    expect(toOrderStatus("authorized")).toBe("pending");
  });
});

describe("adaptRecentOrder", () => {
  it("maps the backend row to the dashboard view model", () => {
    expect(
      adaptRecentOrder({
        id: 5001,
        name: "#FM1",
        customer_name: "Ada L",
        total_price: 95.5,
        currency: "USD",
        financial_status: "paid",
        fulfillment_status: null,
        created_at: "2026-07-05T12:00:00+00:00",
      }),
    ).toEqual({
      id: "5001",
      number: "#FM1",
      customerName: "Ada L",
      total: 95.5,
      status: "paid",
      createdAt: "2026-07-05T12:00:00+00:00",
    });
  });
});

describe("adaptChannels", () => {
  it("normalises revenue to shares", () => {
    expect(
      adaptChannels([
        { channel: "web", revenue: 75, orders: 3 },
        { channel: "instagram", revenue: 25, orders: 1 },
      ]),
    ).toEqual([
      { channel: "web", share: 0.75 },
      { channel: "instagram", share: 0.25 },
    ]);
  });

  it("handles an empty period without dividing by zero", () => {
    expect(adaptChannels([])).toEqual([]);
  });
});

describe("adaptReturnsSpikeTop (SPEC-070/073, backend SPEC-054/068)", () => {
  it("maps raw items to the view model, preserving rank order", () => {
    expect(
      adaptReturnsSpikeTop([
        {
          product: "Gathered Waist Linen Skirt-Ecru",
          product_id: 111,
          rate_pct: 137.5,
          order_id: 5001,
        },
        {
          product: "Perforated Pleated Skirt-Black",
          product_id: 222,
          rate_pct: 133.3,
          order_id: 5002,
        },
      ]),
    ).toEqual([
      { product: "Gathered Waist Linen Skirt-Ecru", productId: 111, ratePct: 137.5, orderId: 5001 },
      { product: "Perforated Pleated Skirt-Black", productId: 222, ratePct: 133.3, orderId: 5002 },
    ]);
  });

  it("passes through a null order_id (defensive backend case)", () => {
    expect(
      adaptReturnsSpikeTop([
        { product: "Untraceable Style", product_id: 333, rate_pct: 50.0, order_id: null },
      ]),
    ).toEqual([{ product: "Untraceable Style", productId: 333, ratePct: 50.0, orderId: null }]);
  });

  it("handles an empty list", () => {
    expect(adaptReturnsSpikeTop([])).toEqual([]);
  });
});

describe("adaptAlerts (SPEC-021)", () => {
  const base = {
    refunds: { count: 2, total: 375.55, pct_of_revenue: 4.2 },
  };

  it("prefers the backend's store-wide inventory_counts", () => {
    const alerts = adaptAlerts({
      ...base,
      inventory_alerts: [{ available: -476 }, { available: 3 }],
      inventory_counts: { low_stock: 41, out_of_stock: 20 },
    } as never);

    expect(alerts.lowStockVariants).toBe(41);
    expect(alerts.outOfStockVariants).toBe(20);
    expect(alerts.refundsAmount).toBe(375.55);
    expect(alerts.refundsCount).toBe(2);
  });

  it("falls back to the alert list and counts oversold as out of stock", () => {
    const alerts = adaptAlerts({
      ...base,
      inventory_alerts: [
        { available: -476 }, // oversold — was counted NOWHERE before SPEC-021
        { available: 0 },
        { available: 3 },
      ],
    } as never);

    expect(alerts.outOfStockVariants).toBe(2); // -476 and 0
    expect(alerts.lowStockVariants).toBe(1); // 3
  });
});

describe("adaptAlerts high discount (SPEC-029)", () => {
  const base = {
    inventory_alerts: [],
    refunds: { count: 0, total: 0, pct_of_revenue: 0 },
  };

  it("maps the backend SPEC-020 high_discount metric", () => {
    const alerts = adaptAlerts({
      ...base,
      high_discount: { products: 2273, min_markdown_pct: 30 },
    } as never);

    expect(alerts.highDiscountProducts).toBe(2273);
  });

  it("falls back to 0 against an older backend without the key", () => {
    const alerts = adaptAlerts({ ...base } as never);

    expect(alerts.highDiscountProducts).toBe(0);
  });
});

describe("adaptAlerts enriched alert signals (SPEC-044)", () => {
  const base = {
    inventory_alerts: [],
    inventory_counts: { low_stock: 3, out_of_stock: 1 },
    refunds: { count: 1, total: 50, pct_of_revenue: 2.5 },
  };

  it("maps low_stock_revenue_at_risk from the backend", () => {
    const alerts = adaptAlerts({
      ...base,
      low_stock_revenue_at_risk: 1250.0,
    } as never);
    expect(alerts.lowStockRevenueAtRisk).toBe(1250.0);
  });

  it("falls back to 0 for low_stock_revenue_at_risk on older backends", () => {
    const alerts = adaptAlerts({ ...base } as never);
    expect(alerts.lowStockRevenueAtRisk).toBe(0);
  });

  it("maps dead_stock products and stock_value", () => {
    const alerts = adaptAlerts({
      ...base,
      dead_stock: { products: 12, units: 340, stock_value: 4800.5 },
    } as never);
    expect(alerts.deadStockProducts).toBe(12);
    expect(alerts.deadStockValue).toBe(4800.5);
  });

  it("falls back to 0 for dead_stock on older backends", () => {
    const alerts = adaptAlerts({ ...base } as never);
    expect(alerts.deadStockProducts).toBe(0);
    expect(alerts.deadStockValue).toBe(0);
  });

  it("maps returns_spike product, product_id, and rate when spike exists", () => {
    const alerts = adaptAlerts({
      ...base,
      returns_spike: { product: "Alpha Tee", product_id: 7001, rate_pct: 40.0 },
    } as never);
    expect(alerts.returnsSpikeProduct).toBe("Alpha Tee");
    expect(alerts.returnsSpikeProductId).toBe(7001);
    expect(alerts.returnsSpikeRate).toBe(40.0);
  });

  it("returns null for returns_spike when no spike detected", () => {
    const alerts = adaptAlerts({
      ...base,
      returns_spike: { product: null, product_id: null, rate_pct: null },
    } as never);
    expect(alerts.returnsSpikeProduct).toBeNull();
    expect(alerts.returnsSpikeProductId).toBeNull();
    expect(alerts.returnsSpikeRate).toBeNull();
  });

  it("falls back to null for returns_spike on older backends", () => {
    const alerts = adaptAlerts({ ...base } as never);
    expect(alerts.returnsSpikeProduct).toBeNull();
    expect(alerts.returnsSpikeProductId).toBeNull();
    expect(alerts.returnsSpikeRate).toBeNull();
  });

  it("maps unfulfilled_alert when today's overdue list has been sent", () => {
    const alerts = adaptAlerts({
      ...base,
      unfulfilled_alert: {
        value: 14236.0,
        count: 217,
        sent: true,
        sent_at: "2026-07-28T07:02:00+00:00",
      },
    } as never);
    expect(alerts.unfulfilledValue).toBe(14236.0);
    expect(alerts.unfulfilledCount).toBe(217);
    expect(alerts.unfulfilledSent).toBe(true);
    expect(alerts.unfulfilledSentAt).toBe("2026-07-28T07:02:00+00:00");
  });

  it("maps unfulfilled_alert as not-yet-sent", () => {
    const alerts = adaptAlerts({
      ...base,
      unfulfilled_alert: { value: 500, count: 4, sent: false, sent_at: null },
    } as never);
    expect(alerts.unfulfilledSent).toBe(false);
    expect(alerts.unfulfilledSentAt).toBeNull();
  });

  it("falls back to 0/false/null for unfulfilled_alert on older backends", () => {
    const alerts = adaptAlerts({ ...base } as never);
    expect(alerts.unfulfilledValue).toBe(0);
    expect(alerts.unfulfilledCount).toBe(0);
    expect(alerts.unfulfilledSent).toBe(false);
    expect(alerts.unfulfilledSentAt).toBeNull();
  });
});

describe("adaptDashboardKpis customer deltas (SPEC-037)", () => {
  const kpis = {
    gross_revenue: 1000,
    net_revenue: 950,
    orders: 20,
    aov: 50,
    refunds_total: 50,
    customers: { active: 10, new: 4, returning: 6, returning_rate_pct: 60 },
  };

  it("serves real customer deltas from backend SPEC-031", () => {
    const result = adaptDashboardKpis({
      ...kpis,
      customers_previous: { active: 8, new: 2, returning: 6, returning_rate_pct: 75 },
      change_pct: {
        gross_revenue: 12.5,
        net_revenue: 11.0,
        orders: -5.0,
        aov: 3.2,
        new_customers: 100.0,
        returning_rate_pct: -15.0,
      },
    });

    const byId = Object.fromEntries(result.map((kpi) => [kpi.id, kpi]));
    expect(byId.revenue.changePercent).toBe(12.5);
    expect(byId.orders.changePercent).toBe(-5.0);
    expect(byId.new_customers.changePercent).toBe(100.0);
    expect(byId.returning_customer_rate.changePercent).toBe(-15.0);
  });

  it("passes null through with comparison off — never a fake 0", () => {
    const result = adaptDashboardKpis({
      ...kpis,
      customers_previous: null,
      change_pct: {
        gross_revenue: null,
        net_revenue: null,
        orders: null,
        aov: null,
        new_customers: null,
        returning_rate_pct: null,
      },
    });

    expect(result.every((kpi) => kpi.changePercent === null)).toBe(true);
  });

  it("stays null against an older backend without customer deltas", () => {
    const result = adaptDashboardKpis({
      ...kpis,
      change_pct: { gross_revenue: 1.0, orders: 2.0, aov: 3.0 },
    });

    const byId = Object.fromEntries(result.map((kpi) => [kpi.id, kpi]));
    expect(byId.new_customers.changePercent).toBeNull();
    expect(byId.returning_customer_rate.changePercent).toBeNull();
    expect(byId.revenue.changePercent).toBe(1.0);
  });
});

describe("adaptRevenueSeries labels (SPEC-037)", () => {
  it("labels by weekday up to 7 points and by date beyond", () => {
    const week = adaptRevenueSeries(
      [{ date: "2026-07-20", revenue: 10, orders: 1 }],
      [],
    );
    expect(week[0].day).toBe("Mon");

    const long = adaptRevenueSeries(
      Array.from({ length: 8 }, (_, i) => ({
        date: `2026-07-${String(i + 10).padStart(2, "0")}`,
        revenue: i,
        orders: i,
      })),
      [],
    );
    expect(long[0].day).toBe("Jul 10");
  });
});

describe("adaptOrderDetail (SPEC-061, backend SPEC-055)", () => {
  const base: ApiOrderDetail = {
    id: 5001,
    name: "#A1",
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    currency: "USD",
    subtotal_price: 100,
    total_discounts: 10,
    total_tax: 8,
    total_price: 98,
    source_name: "web",
    location_id: null,
    location_name: null,
    created_at: "2026-07-28T00:00:00Z",
    updated_at: "2026-07-28T00:00:00Z",
    processed_at: null,
    cancelled_at: null,
    closed_at: null,
    customer: null,
    line_items: [],
    discount_codes: [],
    refunds: [],
  };

  it("maps a full order with a customer, line items, discounts, and refunds", () => {
    const detail = adaptOrderDetail({
      ...base,
      customer: { name: "Ada L", email: "a@example.com", orders_count: 5, total_spent: 450 },
      line_items: [
        {
          id: 6001, product_id: 7001, variant_id: 8001, title: "Alpha Tee",
          variant_title: "M", sku: "ALPHA-M", quantity: 2, price: 25,
          total_discount: 5, image_url: "https://cdn.example.com/alpha.jpg",
        },
      ],
      discount_codes: [{ code: "SAVE10", amount: 10, value_type: "percentage" }],
      refunds: [{ id: 1, note: "damaged", total_refunded: 25, created_at: "2026-07-29T00:00:00Z" }],
    });

    expect(detail.customer).toEqual({
      name: "Ada L", email: "a@example.com", ordersCount: 5, totalSpent: 450,
    });
    expect(detail.lineItems).toEqual([
      {
        id: 6001, productId: 7001, variantId: 8001, title: "Alpha Tee",
        variantTitle: "M", sku: "ALPHA-M", quantity: 2, price: 25,
        totalDiscount: 5, imageUrl: "https://cdn.example.com/alpha.jpg",
      },
    ]);
    expect(detail.discountCodes).toEqual([
      { code: "SAVE10", amount: 10, valueType: "percentage" },
    ]);
    expect(detail.refunds).toEqual([
      { id: 1, note: "damaged", totalRefunded: 25, createdAt: "2026-07-29T00:00:00Z" },
    ]);
  });

  it("keeps null customer and empty sub-collections for a bare order", () => {
    const detail = adaptOrderDetail(base);
    expect(detail.customer).toBeNull();
    expect(detail.lineItems).toEqual([]);
    expect(detail.discountCodes).toEqual([]);
    expect(detail.refunds).toEqual([]);
  });
});

describe("adaptResults (SPEC-067, backend SPEC-063)", () => {
  it("maps snake_case entries to camelCase, preserving the typed link as-is", () => {
    const raw: ApiResults = {
      overdue: [
        {
          headline: "Jackson overdue list sent",
          meta: "Sent Jul 29, 7:02 AM",
          sent_at: "2026-07-29T07:02:00Z",
          verdict: "worked",
          detail: "1 of 2 orders on this list have shipped since the send.",
          link: { type: "orders", location_key: "301" },
        },
      ],
      transfers: [],
      winback: [],
      dead_inventory: [],
      orders: [],
      store_traffic: [],
      discount_review: [
        {
          headline: "Discount review sent to Central's manager",
          meta: "Emailed Jul 29, 7:02 AM",
          sent_at: "2026-07-29T07:02:00Z",
          verdict: "worked",
          detail: "Manual discounting at Central fell from $10/day to $0/day since the email.",
          link: { type: "discounts" },
        },
      ],
      warehouse: [],
      support: [],
      returns: [],
    };

    const data = adaptResults(raw);
    expect(data.overdue).toEqual([
      {
        headline: "Jackson overdue list sent",
        meta: "Sent Jul 29, 7:02 AM",
        sentAt: "2026-07-29T07:02:00Z",
        verdict: "worked",
        detail: "1 of 2 orders on this list have shipped since the send.",
        link: { type: "orders", location_key: "301" },
        // SPEC-241: absent on an older payload → null, never a made-up owner.
        owner: null,
        respondedHours: null,
      },
    ]);
    expect(data.transfers).toEqual([]);
    expect(data.deadInventory).toEqual([]);
    expect(data.discountReview).toEqual([
      {
        headline: "Discount review sent to Central's manager",
        meta: "Emailed Jul 29, 7:02 AM",
        sentAt: "2026-07-29T07:02:00Z",
        verdict: "worked",
        detail: "Manual discounting at Central fell from $10/day to $0/day since the email.",
        link: { type: "discounts" },
        owner: null,
        respondedHours: null,
      },
    ]);
  });
});


describe("adaptNetSales — Shopify sales waterfall (SPEC-184 / backend SPEC-201)", () => {
  const base = {
    gross_revenue: 3_493_751.21,
    net_revenue: 3_152_386.15,
    orders: 12_715,
    aov: 274.77,
    refunds_total: 341_365.06,
    customers: { active: 10, new: 4, returning: 6, returning_rate_pct: 60 },
    change_pct: { gross_revenue: null, orders: null, aov: null },
  };

  it("maps the four backend figures without recomputing them", () => {
    const result = adaptNetSales({
      ...base,
      gross_sales: 4_014_627.85,
      discounts_total: 657_783.62,
      returns_total: 341_365.06,
      net_sales: 3_015_479.17,
    });

    expect(result).toEqual({
      grossSales: 4_014_627.85,
      discounts: 657_783.62,
      returns: 341_365.06,
      netSales: 3_015_479.17,
    });
  });

  it("keeps the backend's net sales even if it disagrees with local arithmetic", () => {
    // Rule 8 — the backend calculates. The adapter must not "correct" it.
    const result = adaptNetSales({
      ...base,
      gross_sales: 100,
      discounts_total: 10,
      returns_total: 5,
      net_sales: 999,
    });

    expect(result?.netSales).toBe(999);
  });

  it("returns null on a backend that predates the waterfall", () => {
    expect(adaptNetSales(base)).toBeNull();
  });

  it("returns null when net_sales is absent even though gross_sales is present", () => {
    expect(adaptNetSales({ ...base, gross_sales: 4_014_627.85 })).toBeNull();
  });

  it("defaults a missing deduction to 0 rather than NaN", () => {
    const result = adaptNetSales({
      ...base,
      gross_sales: 100,
      net_sales: 100,
    });

    expect(result).toEqual({
      grossSales: 100,
      discounts: 0,
      returns: 0,
      netSales: 100,
    });
  });
});


describe("adaptTrueProfit (SPEC-185 / backend SPEC-204)", () => {
  const raw = {
    summary: {
      gross_revenue: 4_174_131.48,
      discounts: 661_496.79,
      cogs: 1_188_530.04,
      returns: 447_545.29,
      true_profit: 1_876_559.36,
      products_counted: 3122,
      loss_makers: 545,
      loss_maker_total: -138_064.96,
      missing_cost_products: 777,
    },
    products: [
      {
        product_id: 1,
        title: "PANELED SKIRT SS26",
        category: "Skirt",
        units: 40,
        units_returned: 3,
        gross_revenue: 5148,
        discounts: 4556,
        cogs: 2574,
        returns: 277,
        true_profit: -2259,
        margin_pct: -43.9,
        cost_coverage_pct: 100,
        verdict: "Losing money",
        verdict_tone: "bad",
      },
      {
        product_id: 2,
        title: "Unknown cost",
        category: "Top",
        units: 5,
        units_returned: 0,
        gross_revenue: 500,
        discounts: 0,
        cogs: 0,
        returns: 0,
        true_profit: 500,
        margin_pct: 100,
        cost_coverage_pct: 0,
        verdict: "No cost data",
        verdict_tone: "muted",
      },
    ],
  };

  it("maps the summary waterfall verbatim", () => {
    const result = adaptTrueProfit(raw);
    expect(result.summary.trueProfit).toBe(1_876_559.36);
    expect(result.summary.lossMakers).toBe(545);
    expect(result.summary.missingCostProducts).toBe(777);
  });

  it("keeps a loss as a negative number rather than an absolute", () => {
    const result = adaptTrueProfit(raw);
    expect(result.products[0].trueProfit).toBe(-2259);
    expect(result.products[0].verdictTone).toBe("bad");
  });

  it("preserves zero cost coverage so the view can mute the row", () => {
    const result = adaptTrueProfit(raw);
    expect(result.products[1].costCoveragePct).toBe(0);
    expect(result.products[1].verdict).toBe("No cost data");
  });

  it("falls back to a muted tone on an unrecognised verdict tone", () => {
    const odd = {
      ...raw,
      products: [{ ...raw.products[0], verdict_tone: "chartreuse" }],
    };
    expect(adaptTrueProfit(odd).products[0].verdictTone).toBe("muted");
  });
});


describe("adaptCannibalisation (SPEC-186 / backend SPEC-205)", () => {
  const raw = {
    summary: {
      codes_counted: 112,
      discount_given: 575_833.06,
      discount_to_existing: 439_040.08,
      existing_share_pct: 76.2,
      new_customers: 65,
      not_acquiring_codes: 87,
      not_acquiring_spend: 192_566.32,
    },
    codes: [
      {
        code: "CUSTOM DISCOUNT",
        orders: 400,
        discount_given: 171_224,
        discount_to_existing: 171_224,
        existing_share_pct: 100,
        new_customers: 0,
        existing_orders: 400,
        unattributed_orders: 12,
        cost_per_new_customer: null,
        verdict: "Not acquiring",
        verdict_tone: "bad",
      },
      {
        code: "FIRSTSTORE",
        orders: 20,
        discount_given: 300,
        discount_to_existing: 0,
        existing_share_pct: 0,
        new_customers: 18,
        existing_orders: 0,
        unattributed_orders: 0,
        cost_per_new_customer: 16.67,
        verdict: "Acquiring",
        verdict_tone: "good",
      },
    ],
  };

  it("maps the summary split", () => {
    const r = adaptCannibalisation(raw);
    expect(r.summary.discountToExisting).toBe(439_040.08);
    expect(r.summary.existingSharePct).toBe(76.2);
    expect(r.summary.notAcquiringCodes).toBe(87);
  });

  it("keeps a null cost-per-new-customer null, never 0", () => {
    // 0 would render as "free", which is the opposite of what it means.
    const r = adaptCannibalisation(raw);
    expect(r.codes[0].costPerNewCustomer).toBeNull();
    expect(r.codes[1].costPerNewCustomer).toBe(16.67);
  });

  it("carries guest orders through as unattributed", () => {
    const r = adaptCannibalisation(raw);
    expect(r.codes[0].unattributedOrders).toBe(12);
  });

  it("passes through the four known tones and defaults anything else to muted", () => {
    const r = adaptCannibalisation(raw);
    expect(r.codes[0].verdictTone).toBe("bad");
    expect(r.codes[1].verdictTone).toBe("good");
    const odd = { ...raw, codes: [{ ...raw.codes[0], verdict_tone: "puce" }] };
    expect(adaptCannibalisation(odd).codes[0].verdictTone).toBe("muted");
  });
});


describe("adaptReturnFixes (SPEC-187 / backend SPEC-206)", () => {
  const raw = {
    summary: {
      returns_with_reason: 877,
      refund_value: 63_817.7,
      fixable_value: 61_384.29,
      fixable_share_pct: 96.2,
      products_counted: 421,
      all_refund_lines: 15_310,
      reason_coverage_pct: 5.7,
    },
    reason_mix: [
      {
        reason: "Item was too small",
        lines: 338,
        value: 22_742,
        share_pct: 38.5,
        fix: "Size chart + fit note",
      },
      {
        reason: "I'd like a different brand instead",
        lines: 7,
        value: 805,
        share_pct: 0.8,
        fix: "No page fix — demand or price",
      },
    ],
    products: [
      {
        product_id: "9912",
        title: "Faux Satin Ruffle Skirt - Black",
        returns: 5,
        refund_value: 903,
        top_reason: "Item was too small",
        top_reason_share_pct: 80,
        fix: "Size chart + fit note",
        value_at_stake: 723,
      },
    ],
  };

  it("carries the coverage numbers so the page can state what it omits", () => {
    const r = adaptReturnFixes(raw);
    expect(r.summary.allRefundLines).toBe(15_310);
    expect(r.summary.reasonCoveragePct).toBe(5.7);
  });

  it("maps value at stake without recomputing it", () => {
    // At stake is observed money, never a projected saving — the adapter must not
    // scale it by anything.
    const r = adaptReturnFixes(raw);
    expect(r.products[0].valueAtStake).toBe(723);
    expect(r.products[0].refundValue).toBe(903);
  });

  it("keeps the reason mix in backend order with its fixes", () => {
    const r = adaptReturnFixes(raw);
    expect(r.reasonMix[0].fix).toBe("Size chart + fit note");
    expect(r.reasonMix[1].fix.startsWith("No page fix")).toBe(true);
  });
});


describe("adaptValueLedger (SPEC-188 / backend SPEC-207)", () => {
  const raw = {
    summary: {
      actions_taken: 12,
      worked: 5,
      no_effect: 4,
      still_measuring: 3,
      measured_value: 250,
      actions_with_value: 1,
    },
    by_category: [
      { category: "winback", actions: 1, worked: 1, value: 250 },
      { category: "transfers", actions: 1, worked: 0, value: 0 },
    ],
    entries: [
      {
        category: "winback",
        headline: "Winback list synced — 2 customers",
        detail: "1 of 2 reordered.",
        meta: "Synced Aug 22",
        sent_at: "2026-08-22T11:00:00+00:00",
        verdict: "worked",
        value: 250,
        value_basis: "Order revenue from the 1 synced customers who reordered.",
      },
      {
        category: "transfers",
        headline: "Transfer sent to Flagship",
        detail: "Daily revenue hasn't risen.",
        meta: "Sent Aug 22",
        sent_at: "2026-08-22T10:00:00+00:00",
        verdict: "none",
        value: null,
        value_basis: null,
      },
    ],
  };

  it("keeps an unattributable value null rather than 0", () => {
    // 0 would read as "this action was worth nothing"; null means "not monetisable".
    const r = adaptValueLedger(raw);
    expect(r.entries[1].value).toBeNull();
    expect(r.entries[0].value).toBe(250);
  });

  it("carries the coverage count so the total is never read as complete", () => {
    const r = adaptValueLedger(raw);
    expect(r.summary.actionsWithValue).toBe(1);
    expect(r.summary.actionsTaken).toBe(12);
  });

  it("passes the value basis through for traceability", () => {
    const r = adaptValueLedger(raw);
    expect(r.entries[0].valueBasis).toContain("reordered");
    expect(r.entries[1].valueBasis).toBeNull();
  });

  it("falls back to a safe verdict on an unknown value", () => {
    const odd = { ...raw, entries: [{ ...raw.entries[0], verdict: "spectacular" }] };
    expect(adaptValueLedger(odd).entries[0].verdict).toBe("none");
  });
});


describe("adaptWhatChanged (SPEC-190 / backend SPEC-214)", () => {
  const raw = {
    summary: {
      revenue_now: 4_174_356,
      revenue_prev: 2_353_863,
      total_delta: 1_820_493,
      total_delta_pct: 77.3,
      products_moved: 3379,
      concentration_pct: 5.4,
    },
    movers: [
      {
        product_id: 1,
        title: "ZIP UP HOODIE-BLACK",
        category: "Tees",
        revenue_now: 12_000,
        revenue_prev: 33_296,
        delta: -21_296,
        units_now: 306,
        units_prev: 784,
        on_hand: 314,
        signal: "Fewer units sold",
        share_of_change_pct: -1.2,
      },
    ],
  };

  it("maps the decomposition without recomputing any delta", () => {
    const r = adaptWhatChanged(raw);
    expect(r.summary.totalDelta).toBe(1_820_493);
    expect(r.movers[0].delta).toBe(-21_296);
  });

  it("keeps a negative share negative — a riser can work against a fall", () => {
    const r = adaptWhatChanged(raw);
    expect(r.movers[0].shareOfChangePct).toBe(-1.2);
  });

  it("passes a null share through rather than defaulting to 0", () => {
    const odd = {
      ...raw,
      summary: { ...raw.summary, total_delta_pct: null },
      movers: [{ ...raw.movers[0], share_of_change_pct: null }],
    };
    const r = adaptWhatChanged(odd);
    expect(r.movers[0].shareOfChangePct).toBeNull();
    expect(r.summary.totalDeltaPct).toBeNull();
  });

  it("carries the signal and stock through for the card to tone", () => {
    const r = adaptWhatChanged(raw);
    expect(r.movers[0].signal).toBe("Fewer units sold");
    expect(r.movers[0].onHand).toBe(314);
  });
});


describe("adaptLaunchWatch (SPEC-192 / backend SPEC-216)", () => {
  const raw = {
    summary: {
      drops_watched: 856,
      at_or_above_winner_pace: 210,
      benchmark_cohort: 4345,
      watch_days: 45,
      urgent_reorders: 152,
    },
    benchmark: { d7: 11, d14: 23, d30: 54, basis: "Median of the top quartile" },
    drops: [
      {
        product_id: 1,
        title: "Mixed Stripe Trumpet Skirt",
        category: "Skirts",
        first_sold_at: "2026-08-17T00:00:00+00:00",
        age_days: 16,
        units_total: 142,
        revenue_total: 9000,
        on_hand: 0,
        milestone_days: 14,
        units_at_milestone: 142,
        benchmark_units: 23,
        pace_ratio: 6.17,
        days_of_cover: 0.0,
        verdict: "Ahead of winners",
        verdict_tone: "good",
      },
      {
        product_id: 2,
        title: "Brand New",
        category: "Tops",
        first_sold_at: "2026-08-31T00:00:00+00:00",
        age_days: 2,
        units_total: 5,
        revenue_total: 500,
        on_hand: 50,
        milestone_days: null,
        units_at_milestone: null,
        benchmark_units: null,
        pace_ratio: null,
        days_of_cover: 20.0,
        verdict: "Too early",
        verdict_tone: "muted",
      },
    ],
  };

  it("maps the pace ratio and benchmark without recomputing", () => {
    const r = adaptLaunchWatch(raw);
    expect(r.drops[0].paceRatio).toBe(6.17);
    expect(r.drops[0].benchmarkUnits).toBe(23);
    expect(r.benchmark.d14).toBe(23);
  });

  it("keeps an unscored drop null rather than a zero pace", () => {
    // A drop too young to score is not a drop scoring zero.
    const r = adaptLaunchWatch(raw);
    expect(r.drops[1].paceRatio).toBeNull();
    expect(r.drops[1].milestoneDays).toBeNull();
  });

  it("preserves zero cover, which is the urgent case not a missing value", () => {
    const r = adaptLaunchWatch(raw);
    expect(r.drops[0].daysOfCover).toBe(0);
    expect(r.drops[0].onHand).toBe(0);
  });

  it("carries the urgent reorder count through", () => {
    const r = adaptLaunchWatch(raw);
    expect(r.summary.urgentReorders).toBe(152);
  });

  it("defaults an unknown tone to muted", () => {
    const odd = { ...raw, drops: [{ ...raw.drops[0], verdict_tone: "neon" }] };
    expect(adaptLaunchWatch(odd).drops[0].verdictTone).toBe("muted");
  });
});
