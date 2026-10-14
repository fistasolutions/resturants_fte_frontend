import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";
import {
  allowancePercent,
  money,
  portalFailure,
  toAllowance,
  toInvoice,
  toPlanOptions,
  toTopupPacks,
  seatsLabel,
  toSubscription,
} from "@/lib/billing-settings";
import type { ApiPlan } from "@/lib/onboarding";

const PLANS: ApiPlan[] = [
  { key: "under_3m", name: "Starter", band_label: "under $3M", min_revenue: 0, max_revenue: 3_000_000, price_cents: 14900, currency: "USD", interval: "month", ai_allowance_cents: 2000 },
  { key: "3m_to_30m", name: "Growth", band_label: "$3M–$30M", min_revenue: 3_000_000, max_revenue: 30_000_000, price_cents: 34900, currency: "USD", interval: "month", ai_allowance_cents: 5000 },
];

describe("billing settings", () => {
  it("formats platform money in the plan's own currency", () => {
    expect(money(34900, "USD")).toBe("$349");
    expect(money(11260, "usd")).toBe("$112.60");
    expect(money(5000, "GBP")).toBe("£50");
  });

  it("names the subscription from the plan catalogue", () => {
    const view = toSubscription(
      {
        plan_key: "3m_to_30m",
        price_cents: 34900,
        currency: "USD",
        interval: "month",
        status: "active",
        provider: "stripe",
        started_at: "2026-07-14T00:00:00Z",
        current_period_end: "2026-10-28T00:00:00Z",
      },
      PLANS,
    );
    expect(view.planName).toBe("Growth");
    expect(view.price).toBe("$349");
    expect(view.statusLabel).toBe("Active");
    expect(view.statusTone).toBe("success");
    expect(view.paidThroughStripe).toBe(true);
  });

  it("keeps an unknown plan and status readable", () => {
    const view = toSubscription(
      { plan_key: "legacy", price_cents: 0, currency: "USD", interval: "year", status: "past_due", provider: "preview", started_at: "", current_period_end: "" },
      PLANS,
    );
    expect(view.planName).toBe("legacy");
    expect(view.statusLabel).toBe("Payment due");
    expect(view.interval).toBe("year");
    expect(view.paidThroughStripe).toBe(false);
  });

  it("maps invoices with their status tone", () => {
    const paid = toInvoice({ id: "in_1", number: "A-12", created_at: "2026-09-28T00:00:00Z", description: null, amount_cents: 34900, currency: "usd", status: "paid", hosted_url: "https://x" });
    expect(paid).toMatchObject({ number: "A-12", amount: "$349", statusLabel: "Paid", statusTone: "success", description: "Subscription" });
    expect(toInvoice({ ...{ id: "in_2", number: null, created_at: "", description: "x", amount_cents: 1, currency: "usd", status: "open", hosted_url: null } }).statusTone).toBe("warning");
  });

  it("clamps the allowance meter", () => {
    expect(allowancePercent(3210, 5000)).toBe(64);
    expect(allowancePercent(9000, 5000)).toBe(100);
    expect(allowancePercent(0, 0)).toBe(0);
    expect(allowancePercent(5, 0)).toBe(100);
  });

  it("tones the allowance as it fills", () => {
    const base = { plan_key: "x", allowance_cents: 5000, remaining_cents: 0, own_key_cents: 0, unmetered: false, resets_at: "2026-10-01T00:00:00Z" };
    expect(toAllowance({ ...base, used_cents: 1000 }).tone).toBe("success"); // 20%
    // SPEC-374: running low from 60% — just under stays success, at/over is warning.
    expect(toAllowance({ ...base, used_cents: 2950 }).tone).toBe("success"); // 59%
    expect(toAllowance({ ...base, used_cents: 3000 }).tone).toBe("warning"); // 60%
    expect(toAllowance({ ...base, used_cents: 4200 }).tone).toBe("warning"); // 84%
    expect(toAllowance({ ...base, used_cents: 6000, remaining_cents: -1000 })).toMatchObject({ tone: "destructive", remaining: "$0", percent: 100 });
    expect(toAllowance({ ...base, used_cents: 0, own_key_cents: 250 })).toMatchObject({ hasOwnKeyUse: true, ownKeys: "$2.50" });
  });

  it("lists the plans in the catalogue's order", () => {
    expect(toPlanOptions(PLANS).map((p) => [p.name, p.price, p.aiAllowance])).toEqual([
      ["Starter", "$149", "$20"],
      ["Growth", "$349", "$50"],
    ]);
  });

  it("labels the seats a plan includes (SPEC-373)", () => {
    expect(seatsLabel(10)).toBe("10 seats");
    expect(seatsLabel(1)).toBe("1 seat");
    expect(seatsLabel(null)).toBe("Unlimited seats");
    expect(seatsLabel(undefined)).toBe("");
    expect(toPlanOptions([{ ...PLANS[0], seats: 10 }])[0].seats).toBe("10 seats");
  });

  it("formats the AI credit packs at their 3x price and reads the top-up on the allowance (SPEC-384)", () => {
    const packs = toTopupPacks({
      markup: 3,
      packs: [
        { credit_cents: 1000, price_cents: 3000, currency: "USD" },
        { credit_cents: 2500, price_cents: 7500, currency: "USD" },
      ],
    });
    expect(packs).toEqual([
      { creditCents: 1000, credit: "$10", price: "$30" },
      { creditCents: 2500, credit: "$25", price: "$75" },
    ]);
    const base = { plan_key: "x", allowance_cents: 7000, used_cents: 0, remaining_cents: 7000, own_key_cents: 0, unmetered: false, resets_at: "2026-10-01T00:00:00Z" };
    expect(toAllowance({ ...base, topup_cents: 2000 })).toMatchObject({ topupCents: 2000, topup: "$20" });
    expect(toAllowance(base)).toMatchObject({ topupCents: 0 }); // older backend: no top-up field
  });

  it("explains why the portal could not open", () => {
    expect(portalFailure(new ApiError(409, "no_payment_account", "x"))).toMatch(/no card on file/);
    expect(portalFailure(new ApiError(503, "payments_not_configured", "x"))).toMatch(/not set up/);
    expect(portalFailure(new Error("boom"))).toMatch(/Stripe could not be reached/);
  });
});

describe("the package's videos and images (SPEC-327)", async () => {
  const { toMedia } = await import("@/lib/billing-settings");
  const base = { plan_key: "up_to_3m", allowance_cents: 0, used_cents: 0, remaining_cents: 0, own_key_cents: 0, unmetered: false, resets_at: "2026-10-01T00:00:00Z" };

  it("counts the extra granted into the allowance and colours the bar", () => {
    const view = toMedia({
      ...base,
      media: { videos: { used: 8, limit: 8, granted: 2 }, images: { used: 40, limit: 40, granted: 0 }, unmetered: false },
    });
    expect(view?.rows[0]).toMatchObject({ summary: "8 of 10 videos used", extra: "+2 extra this month", percent: 80, tone: "warning" });
    expect(view?.rows[1]).toMatchObject({ summary: "40 of 40 images used", extra: null, percent: 100, tone: "destructive" });
  });

  it("says when the package has no limit, and hides without media", () => {
    const view = toMedia({ ...base, media: { videos: { used: 1, limit: null, granted: 0 }, images: { used: 0, limit: 0, granted: 0 }, unmetered: false } });
    expect(view?.rows[0]).toMatchObject({ noLimit: true, percent: null, summary: "1 video made" });
    expect(view?.rows[1]).toMatchObject({ summary: "0 of 0 images used", percent: 0 });
    expect(toMedia(base)).toBeNull();
    expect(toMedia({ ...base, media: null })).toBeNull();
  });
});
