import { afterEach, describe, expect, it } from "vitest";

import { formatMoney as seasonMoney } from "@/lib/season";
import { formatMoney as stockoutMoney } from "@/lib/stockout";
import { priceBand } from "@/lib/competitors";
import {
  DEFAULT_STORE_LOCALE,
  getStoreLocale,
  isDefaultLocale,
  resolveStoreLocale,
  setStoreLocale,
  syncClientStoreLocale,
} from "@/lib/store-locale";
import { formatWatchValue } from "@/lib/watchlist";
import {
  currencySymbol,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatWholeMoney,
  getGreeting,
  storeTimeZone,
} from "@/utils/format";

const LONDON = { currency: "GBP", timeZone: "Europe/London" };

afterEach(() => setStoreLocale(DEFAULT_STORE_LOCALE));

describe("resolveStoreLocale", () => {
  it("keeps a store's valid values, normalising the currency's case", () => {
    expect(resolveStoreLocale("gbp", "Europe/London")).toEqual(LONDON);
  });

  it("falls back field by field", () => {
    expect(resolveStoreLocale("NOPE1", "Europe/London")).toEqual({ currency: "USD", timeZone: "Europe/London" });
    expect(resolveStoreLocale("EUR", "Mars/Olympus")).toEqual({ currency: "EUR", timeZone: "America/New_York" });
    expect(resolveStoreLocale(null, undefined)).toEqual(DEFAULT_STORE_LOCALE);
    expect(resolveStoreLocale("  ", "")).toEqual(DEFAULT_STORE_LOCALE);
  });

  it("knows the default", () => {
    expect(isDefaultLocale(resolveStoreLocale("usd", "America/New_York"))).toBe(true);
    expect(isDefaultLocale(LONDON)).toBe(false);
  });

  it("never sets the shared locale on the server", () => {
    // Vitest runs in node: no window, as on the server.
    syncClientStoreLocale(LONDON);
    expect(getStoreLocale()).toEqual(DEFAULT_STORE_LOCALE);
  });
});

describe("formatters follow the store", () => {
  it("default: US dollars, New York", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(currencySymbol()).toBe("$");
    expect(storeTimeZone()).toBe("America/New_York");
  });

  it("money in the store's currency", () => {
    setStoreLocale(LONDON);
    expect(formatCurrency(1234.5)).toBe("£1,234.50");
    expect(formatCompactCurrency(24_100)).toBe("£24.1K");
    expect(formatWholeMoney(1234.5)).toBe("£1,235");
    expect(currencySymbol()).toBe("£");
    setStoreLocale({ currency: "CAD", timeZone: "America/Toronto" });
    expect(currencySymbol()).toBe("CA$");
  });

  it("instants in the store's zone; date-only strings never shift", () => {
    // 02:30 UTC on the 1st is still the 30th in New York and the 1st in London.
    const instant = "2026-10-01T02:30:00Z";
    expect(formatDate(instant)).toBe("Sep 30, 2026");
    setStoreLocale(LONDON);
    expect(formatDate(instant)).toBe("Oct 1, 2026");
    expect(formatTime(instant)).toBe("3:30 AM");
    expect(formatDateTime(instant)).toBe("Oct 1, 2026, 3:30 AM");
    expect(formatDate("2026-10-01")).toBe("Oct 1, 2026");
  });

  it("the greeting reads the store's hour", () => {
    const at = new Date("2026-10-01T08:00:00Z");
    expect(getGreeting(at, "Europe/London")).toBe("Good morning"); // 09:00
    expect(getGreeting(at, "America/Los_Angeles")).toBe("Good evening"); // 01:00
    expect(getGreeting(at, "Not/AZone")).toBe(getGreeting(at));
  });

  it("the hand-written money helpers use the store currency", () => {
    setStoreLocale(LONDON);
    expect(seasonMoney(1200.4)).toBe("£1,200");
    expect(stockoutMoney(1200.4)).toBe("£1,200");
    expect(priceBand({ priceMin: 39, priceMax: 149 })).toBe("£39–£149");
    expect(formatWatchValue("usd", 12_400)).toBe("£12,400");
    expect(formatWatchValue("usd", 12.4)).toBe("£12.40");
  });
});
