/**
 * SPEC-331 — Finance for any organization: the reporting currency, the rates behind it, a
 * converted bill's original, the owner's rate input, and the guard on disconnecting every
 * company at once.
 */
import { describe, expect, it } from "vitest";

import { toBill, toConnections, type ApiBill, type ApiConnections } from "@/lib/finance-api";
import {
  confirmsDisconnect,
  originalLine,
  parseRateInput,
  rateLabel,
  reportingLine,
  waitingForRates,
} from "@/lib/finance-currency";
import { compactMoney } from "@/lib/finance";

const CONNECTIONS: ApiConnections = {
  connections: [
    {
      id: 1,
      company_name: "North Store",
      realm_id_masked: "9130…4471",
      status: "connected",
      last_synced_at: null,
      last_error: null,
      connected_at: null,
      home_currency: "USD",
      fx_missing: [],
    },
    {
      id: 2,
      company_name: "Toronto",
      realm_id_masked: "9130…8852",
      status: "connected",
      last_synced_at: null,
      last_error: "Books in CAD — set a CAD → USD rate in Finance to include this company.",
      connected_at: null,
      home_currency: "CAD",
      fx_missing: ["CAD"],
    },
  ],
  connected: 2,
  ready: true,
  configured: true,
  syncing: false,
  reporting_currency: "USD",
  rates: [{ currency: "EUR", rate: 1.0812, source: "quickbooks", as_of: "2026-10-01" }],
};

describe("the reporting currency and its rates", () => {
  const overview = toConnections(CONNECTIONS);

  it("adapts the new fields and defaults them for an older server", () => {
    expect(overview.reportingCurrency).toBe("USD");
    expect(overview.connections[1].fxMissing).toEqual(["CAD"]);
    const old = toConnections({ ...CONNECTIONS, reporting_currency: undefined, rates: undefined });
    expect(old.reportingCurrency).toBe("");
    expect(old.rates).toEqual([]);
    expect(reportingLine(old)).toBeNull();
  });

  it("says what every figure is in and where each rate came from", () => {
    expect(reportingLine(overview)).toBe("All figures in USD");
    expect(rateLabel(overview.rates[0], "USD")).toBe("EUR → USD 1.0812 · QuickBooks, Oct 1");
    expect(rateLabel({ currency: "CAD", rate: 0.734212345, source: "owner", asOf: "2026-10-01" }, "USD")).toBe(
      "CAD → USD 0.734212 · your rate, Oct 1",
    );
  });

  it("names the companies waiting for a rate", () => {
    expect(waitingForRates(overview)).toEqual([{ company: "Toronto", currencies: ["CAD"] }]);
  });
});

describe("a converted bill", () => {
  const raw = {
    id: 7,
    qbo_id: "41",
    realm_id: "9130123456788852",
    number: "TO-1",
    vendor: "Maple Freight",
    category: "Shipping",
    company: "Toronto",
    billed_on: "2026-09-20",
    due_on: "2026-10-20",
    amount: 9104.08,
    balance: 9104.08,
    status: "open",
    terms: "Net 30",
    memo: "",
    lines: 1,
    currency: "CAD",
    original_amount: 12400,
    original_balance: 12400,
    fx_rate: 0.7342,
  } as ApiBill;

  it("shows the original as QuickBooks wrote it", () => {
    // Intl joins the code and the figure with a non-breaking space, so they never wrap apart.
    expect(originalLine(toBill(raw))?.replace(/\s/g, " ")).toBe("CAD 12,400.00 at 0.7342");
  });

  it("shows nothing for a bill in the reporting currency or read before originals were kept", () => {
    expect(originalLine(toBill({ ...raw, currency: "USD", fx_rate: 1 }))).toBeNull();
    expect(originalLine(toBill({ ...raw, original_balance: undefined, fx_rate: undefined }))).toBeNull();
  });
});

describe("the owner's rate", () => {
  it("accepts a positive number with up to six decimals", () => {
    expect(parseRateInput(" 0.7342 ")).toEqual({ ok: true, value: 0.7342 });
    expect(parseRateInput("1,350.5")).toEqual({ ok: true, value: 1350.5 });
  });

  it("refuses what would be a typo", () => {
    expect(parseRateInput("")).toEqual({ ok: false, error: "Enter the rate." });
    expect(parseRateInput("abc")).toEqual({ ok: false, error: "Enter a number, such as 0.7342." });
    expect(parseRateInput("0")).toEqual({ ok: false, error: "The rate must be more than 0." });
    expect(parseRateInput("-1")).toEqual({ ok: false, error: "Enter a number, such as 0.7342." });
    expect(parseRateInput("0.12345678")).toEqual({ ok: false, error: "Use at most six decimal places." });
    expect(parseRateInput("2000000")).toEqual({ ok: false, error: "That rate is too large." });
  });
});

describe("disconnecting every company", () => {
  it("needs the word typed, in any case, and nothing else", () => {
    expect(confirmsDisconnect("DISCONNECT")).toBe(true);
    expect(confirmsDisconnect("  disconnect ")).toBe(true);
    expect(confirmsDisconnect("disconnec")).toBe(false);
    expect(confirmsDisconnect("yes")).toBe(false);
  });
});

describe("small amounts follow the store's currency", () => {
  it("never hard-codes a dollar sign", () => {
    // The test locale is USD, so the symbol is still $ — but it now comes from the
    // store's formatter, the same one the large amounts use.
    expect(compactMoney(450)).toBe("$450");
    expect(compactMoney(-450)).toBe("-$450");
    expect(compactMoney(12_300)).toBe("$12.3K");
  });
});
