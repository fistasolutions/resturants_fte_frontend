/**
 * Watchlist (SPEC-262): the pure half of Settings → Watching and the form —
 * formatting a reading in its unit, the meter against the line, status wording,
 * and the form's validation. The figures themselves come from the backend.
 */
import type {
  Watch,
  WatchDirection,
  WatchMetric,
  WatchRecipient,
  WatchUnit,
} from "@/types/watch";
import { formatCurrency, formatWholeMoney } from "@/utils/format";

export const RECIPIENT_LABELS: Record<WatchRecipient, string> = {
  owner: "Email me",
  returns: "Returns lead",
  warehouse: "Warehouse",
  support: "Support lead",
  managers: "Store managers",
};

export const PERIOD_LABELS: Record<string, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export const UNIT_SUFFIX: Record<WatchUnit, string> = {
  pct: "%",
  usd: "", // money: the currency symbol is drawn as a prefix (`currencySymbol()`)
  count: "",
  days: "days",
};

/** Three rules the empty state shows — each one the form can make. */
export const EXAMPLES: readonly string[] = [
  "Return rate on a style above 20%",
  "Days of stock cover on a best seller below 5",
  "Revenue vs the period before below -15%",
];

/** A reading in its unit — `23.1%`, `$12,400`, `41`, `9 days`. */
export function formatWatchValue(unit: WatchUnit, value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  if (unit === "pct") return `${value.toFixed(1)}%`;
  if (unit === "usd") {
    // The unit key is the backend's name; the money is the store's currency (SPEC-319).
    return Math.abs(value) >= 1000 ? formatWholeMoney(value) : formatCurrency(value);
  }
  if (unit === "days") {
    const whole = Number.isInteger(value) ? value : Number(value.toFixed(1));
    return `${whole} ${whole === 1 ? "day" : "days"}`;
  }
  return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(1);
}

export interface Meter {
  /** How far along the bar the reading sits, 0–1. */
  fill: number;
  /** Where the line sits, 0–1. */
  line: number;
  /** True when the reading is past the line in the watched direction. */
  over: boolean;
}

/**
 * The bar under a reading: the line sits at 70% of the bar and the reading is
 * scaled against it, so "past the line" always reads as "past the mark". A
 * `below` watch is mirrored — the bar fills as the figure falls toward the line.
 * Null when there is no reading yet.
 */
export function meter(direction: WatchDirection, value: number | null, threshold: number): Meter | null {
  if (value === null || Number.isNaN(value)) return null;
  const line = 0.7;
  const over = direction === "above" ? value > threshold : value < threshold;
  if (direction === "above") {
    const scale = threshold > 0 ? value / threshold : value > 0 ? 2 : 0;
    return { fill: clamp(scale * line), line, over };
  }
  // Below: full bar = at or under the line; the further above the line, the emptier.
  const headroom = Math.abs(threshold) > 0 ? Math.abs(threshold) : 1;
  const distance = (value - threshold) / headroom; // 0 at the line, 1 one "threshold" above it
  return { fill: clamp(line * (1 - distance) + (over ? line * 0.3 : 0)), line, over };
}

function clamp(value: number): number {
  return Math.max(0.02, Math.min(1, value));
}

export type StatusTone = "fired" | "quiet" | "paused" | "pending";

/** The status chip's tone and wording. */
export function statusLabel(watch: Watch, now = Date.now()): { tone: StatusTone; label: string } {
  if (watch.status === "paused") return { tone: "paused", label: "Paused" };
  if (watch.state === "fired" && watch.firedAt) {
    return { tone: "fired", label: `Fired ${relative(watch.firedAt, now)}` };
  }
  if (watch.lastCheckedAt === null) return { tone: "pending", label: "Not checked yet" };
  if (watch.lastValue === null) return { tone: "pending", label: "No reading" };
  const since = watch.firedAt ?? watch.createdAt;
  return { tone: "quiet", label: since ? `Quiet · ${quietFor(since, now)}` : "Quiet" };
}

/** "today 09:42", "yesterday 17:05", "3 days ago". */
export function relative(iso: string, now = Date.now()): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const time = at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const days = daysBetween(at, new Date(now));
  if (days === 0) return `today ${time}`;
  if (days === 1) return `yesterday ${time}`;
  return `${days} days ago`;
}

function quietFor(iso: string, now: number): string {
  const days = daysBetween(new Date(iso), new Date(now));
  if (days <= 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
}

function daysBetween(a: Date, b: Date): number {
  const dayA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const dayB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.round((dayB - dayA) / 86_400_000));
}

/** The Tell column's chips. */
export function tellLabels(watch: Watch): string[] {
  const out: string[] = [];
  if (watch.notifyNudge) out.push("Nudge");
  if (watch.notifyEmail) out.push(RECIPIENT_LABELS[watch.notifyEmail]);
  return out.length ? out : ["Nobody"];
}

export function metricNeedsProduct(metric: WatchMetric | undefined): boolean {
  return metric?.subject === "product";
}

export function metricTakesProduct(metric: WatchMetric | undefined): boolean {
  return metric?.subject === "product" || metric?.subject === "optional_product";
}

export interface WatchFormValue {
  metric: string;
  productQuery: string;
  period: string;
  direction: WatchDirection;
  threshold: string;
  notifyNudge: boolean;
  notifyEmail: WatchRecipient | "";
}

export function emptyForm(metrics: WatchMetric[]): WatchFormValue {
  const first = metrics[0];
  return {
    metric: first?.key ?? "",
    productQuery: "",
    period: first?.periods[0] ?? "",
    direction: "above",
    threshold: "",
    notifyNudge: true,
    notifyEmail: "",
  };
}

export function formFromWatch(watch: Watch): WatchFormValue {
  return {
    metric: watch.metric,
    productQuery: watch.subjectLabel ?? "",
    period: watch.period ?? "",
    direction: watch.direction,
    threshold: String(watch.threshold),
    notifyNudge: watch.notifyNudge,
    notifyEmail: watch.notifyEmail ?? "",
  };
}

/** Field → message; empty when the form can be sent. */
export function validateWatchForm(
  value: WatchFormValue,
  metrics: WatchMetric[],
): Partial<Record<keyof WatchFormValue, string>> {
  const errors: Partial<Record<keyof WatchFormValue, string>> = {};
  const metric = metrics.find((m) => m.key === value.metric);
  if (!metric) errors.metric = "Pick what to watch.";
  if (metric && metricNeedsProduct(metric) && !value.productQuery.trim()) {
    errors.productQuery = "This one needs a product — type its name.";
  }
  if (metric && metric.periods.length > 0 && !metric.periods.includes(value.period)) {
    errors.period = "Pick a period.";
  }
  const threshold = Number(value.threshold);
  if (value.threshold.trim() === "" || Number.isNaN(threshold)) {
    errors.threshold = "Enter the line to cross, as a number.";
  } else if (metric?.unit === "pct" && (threshold < -1000 || threshold > 1000)) {
    errors.threshold = "A percentage between -1000 and 1000.";
  }
  if (!value.notifyNudge && !value.notifyEmail) {
    errors.notifyEmail = "Tell someone — the nudge, an email, or both.";
  }
  return errors;
}

/** The preview sentence under the form, in the backend's wording. */
export function previewRule(value: WatchFormValue, metrics: WatchMetric[]): string | null {
  const metric = metrics.find((m) => m.key === value.metric);
  const threshold = Number(value.threshold);
  if (!metric || value.threshold.trim() === "" || Number.isNaN(threshold)) return null;
  const head = value.productQuery.trim()
    ? `${value.productQuery.trim()} ${metric.label.toLowerCase()}`
    : metric.label;
  const when =
    metric.periods.length && value.period ? ` (${PERIOD_LABELS[value.period]?.toLowerCase() ?? value.period})` : "";
  return `${head} ${value.direction} ${formatWatchValue(metric.unit, threshold)}${when}`;
}
