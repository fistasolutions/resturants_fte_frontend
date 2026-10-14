import { describe, expect, it } from "vitest";

import {
  emptyForm,
  formatWatchValue,
  formFromWatch,
  meter,
  previewRule,
  relative,
  statusLabel,
  tellLabels,
  validateWatchForm,
} from "@/lib/watchlist";
import { toWatch, type ApiWatch } from "@/lib/watch-adapter";
import type { Watch, WatchMetric } from "@/types/watch";

const METRICS: WatchMetric[] = [
  { key: "return_rate", label: "Return rate", unit: "pct", subject: "optional_product", periods: ["30d", "7d", "90d"], href: "/returns", hint: "" },
  { key: "stock", label: "Units in stock", unit: "count", subject: "product", periods: [], href: "/inventory", hint: "" },
  { key: "unshipped", label: "Paid orders waiting over 48 hours", unit: "count", subject: "none", periods: [], href: "/orders/review", hint: "" },
];

const API: ApiWatch = {
  id: 1, metric: "return_rate", label: "Return rate", unit: "pct", subject_label: "Katie Dress", product_id: 7,
  period: "30d", direction: "above", threshold: 20, notify_nudge: true, notify_email: "returns", status: "watching",
  state: "fired", baseline_value: 14.2, last_value: 23.1, last_checked_at: "2026-09-17T09:42:00+00:00",
  fired_at: "2026-09-17T09:42:00+00:00", fired_value: 23.1, fired_note: "Katie Dress return rate hit 23.1% — past your 20.0% line.",
  fire_count: 1, email_sent_at: null, email_error: "No returns lead email is set in Settings",
  rule: "Katie Dress return rate above 20.0% (the last 30 days)", current: "23.1%", href: "/returns", created_at: "2026-09-15T08:00:00+00:00",
};
const WATCH: Watch = toWatch(API);
const NOW = new Date("2026-09-17T12:00:00+00:00").getTime();

describe("formatWatchValue", () => {
  it("reads in the unit", () => {
    expect(formatWatchValue("pct", 23.1)).toBe("23.1%");
    expect(formatWatchValue("usd", 12400)).toBe("$12,400");
    expect(formatWatchValue("usd", 950.5)).toBe("$950.50");
    expect(formatWatchValue("count", 41)).toBe("41");
    expect(formatWatchValue("days", 9)).toBe("9 days");
    expect(formatWatchValue("days", 1)).toBe("1 day");
    expect(formatWatchValue("pct", null)).toBe("—");
  });
});

describe("meter", () => {
  it("puts the line at 70% and scales the reading against it", () => {
    expect(meter("above", 10, 20)).toEqual({ fill: 0.35, line: 0.7, over: false });
    expect(meter("above", 23.1, 20)?.over).toBe(true);
    expect(meter("above", 60, 20)?.fill).toBe(1);
    expect(meter("above", null, 20)).toBeNull();
  });
  it("mirrors a below watch — fuller as the figure falls toward the line", () => {
    const far = meter("below", 15, 5);
    const near = meter("below", 6, 5);
    const over = meter("below", 4, 5);
    expect(far && near && over).toBeTruthy();
    expect(far!.fill).toBeLessThan(near!.fill);
    expect(over!.over).toBe(true);
    expect(over!.fill).toBeGreaterThan(near!.fill);
  });
});

describe("statusLabel / relative / tellLabels", () => {
  it("wordings", () => {
    expect(statusLabel(WATCH, NOW)).toEqual({ tone: "fired", label: `Fired ${relative(API.fired_at!, NOW)}` });
    expect(relative("2026-09-17T09:42:00+00:00", NOW)).toMatch(/^today \d\d:\d\d$/);
    expect(relative("2026-09-14T09:42:00+00:00", NOW)).toBe("3 days ago");
    expect(statusLabel({ ...WATCH, status: "paused" }, NOW)).toEqual({ tone: "paused", label: "Paused" });
    expect(statusLabel({ ...WATCH, state: "quiet", firedAt: null }, NOW)).toEqual({ tone: "quiet", label: "Quiet · 2 days" });
    expect(statusLabel({ ...WATCH, state: "quiet", lastCheckedAt: null }, NOW).tone).toBe("pending");
    expect(statusLabel({ ...WATCH, state: "quiet", lastValue: null }, NOW).label).toBe("No reading");
    expect(tellLabels(WATCH)).toEqual(["Nudge", "Returns lead"]);
    expect(tellLabels({ ...WATCH, notifyNudge: false, notifyEmail: null })).toEqual(["Nobody"]);
  });
});

describe("the form", () => {
  it("starts on the first metric with its default period and round-trips a watch", () => {
    expect(emptyForm(METRICS)).toEqual({ metric: "return_rate", productQuery: "", period: "30d", direction: "above", threshold: "", notifyNudge: true, notifyEmail: "" });
    expect(formFromWatch(WATCH)).toEqual({ metric: "return_rate", productQuery: "Katie Dress", period: "30d", direction: "above", threshold: "20", notifyNudge: true, notifyEmail: "returns" });
  });
  it("validates what the backend would reject, before the round trip", () => {
    const base = emptyForm(METRICS);
    expect(validateWatchForm({ ...base, threshold: "20" }, METRICS)).toEqual({});
    expect(validateWatchForm(base, METRICS).threshold).toBeTruthy();
    expect(validateWatchForm({ ...base, threshold: "abc" }, METRICS).threshold).toBeTruthy();
    expect(validateWatchForm({ ...base, threshold: "2000" }, METRICS).threshold).toBeTruthy();
    expect(validateWatchForm({ ...base, metric: "stock", period: "", threshold: "50" }, METRICS).productQuery).toBeTruthy();
    expect(validateWatchForm({ ...base, metric: "stock", period: "", threshold: "50", productQuery: "Katie" }, METRICS)).toEqual({});
    expect(validateWatchForm({ ...base, period: "1y", threshold: "20" }, METRICS).period).toBeTruthy();
    expect(validateWatchForm({ ...base, threshold: "20", notifyNudge: false }, METRICS).notifyEmail).toBeTruthy();
    expect(validateWatchForm({ ...base, metric: "zzz", threshold: "20" }, METRICS).metric).toBeTruthy();
  });
  it("previews the rule in the backend's wording", () => {
    expect(previewRule({ ...emptyForm(METRICS), productQuery: "Katie Dress", threshold: "20" }, METRICS)).toBe(
      "Katie Dress return rate above 20.0% (last 30 days)",
    );
    expect(previewRule({ ...emptyForm(METRICS), metric: "unshipped", period: "", threshold: "5" }, METRICS)).toBe(
      "Paid orders waiting over 48 hours above 5",
    );
    expect(previewRule(emptyForm(METRICS), METRICS)).toBeNull();
  });
});

describe("toWatch", () => {
  it("maps every field", () => {
    expect(WATCH.subjectLabel).toBe("Katie Dress");
    expect(WATCH.notifyEmail).toBe("returns");
    expect(WATCH.emailError).toBe("No returns lead email is set in Settings");
    expect(WATCH.fireCount).toBe(1);
  });
});
