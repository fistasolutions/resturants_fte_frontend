/**
 * Settings → Billing & plan (SPEC-324 over backend SPEC-331): the subscription, the AI
 * allowance, the invoices and the plans, as the tab shows them. Pure.
 *
 * Platform money is always in the plan's own currency (what the organization pays us), never
 * the store's currency — so it is formatted here with an explicit currency, not the store
 * locale the rest of the app formats with.
 */
import { ApiError } from "@/lib/api-error";
import type { ApiPlan } from "@/lib/onboarding";

export interface ApiSubscription {
  plan_key: string;
  price_cents: number;
  currency: string;
  interval: string;
  status: string;
  provider: string;
  started_at: string;
  current_period_end: string;
}

export interface ApiInvoice {
  id: string;
  number: string | null;
  created_at: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  hosted_url: string | null;
}

/** SPEC-327 / backend SPEC-335: one of the package's monthly generation meters. */
export interface ApiMediaMeter {
  used: number;
  /** The package's limit; null = no limit on the package. */
  limit: number | null;
  /** Extra the platform granted this month. */
  granted: number;
}

export interface ApiAllowance {
  /** Absent from an older backend, or when there is no store yet. */
  media?: { videos: ApiMediaMeter; images: ApiMediaMeter; unmetered: boolean } | null;
  plan_key: string | null;
  allowance_cents: number;
  used_cents: number;
  remaining_cents: number;
  own_key_cents: number;
  // SPEC-384: AI credit bought for this month, already in allowance_cents (absent on an older backend).
  topup_cents?: number;
  unmetered: boolean;
  resets_at: string;
}

export interface ApiPlans {
  payment: { provider: "stripe" | "preview"; test_mode: boolean };
  plans: ApiPlan[];
}

export type Tone = "success" | "warning" | "destructive" | "muted";

export interface SubscriptionView {
  planKey: string;
  planName: string;
  band: string | null;
  price: string;
  interval: string;
  status: string;
  statusLabel: string;
  statusTone: Tone;
  paidThroughStripe: boolean;
  renewsAt: string;
  startedAt: string;
}

export interface InvoiceView {
  id: string;
  number: string;
  createdAt: string;
  description: string;
  amount: string;
  status: string;
  statusLabel: string;
  statusTone: Tone;
  url: string | null;
}

export interface AllowanceView {
  unmetered: boolean;
  allowance: string;
  used: string;
  remaining: string;
  ownKeys: string;
  hasOwnKeyUse: boolean;
  /** SPEC-384: extra AI added this month (cents, and formatted). */
  topupCents: number;
  topup: string;
  /** 0–100, clamped. */
  percent: number;
  tone: Tone;
  resetsAt: string;
}

export interface MediaRow {
  key: "videos" | "images";
  label: string;
  /** "7 of 10 used" / "3 made" when there is no limit. */
  summary: string;
  /** "+2 extra this month", when the platform granted extra. */
  extra: string | null;
  /** 0–100, clamped; null when there is no limit. */
  percent: number | null;
  tone: Tone;
  noLimit: boolean;
}

export interface MediaView {
  unmetered: boolean;
  rows: MediaRow[];
}

const MEDIA_LABEL = { videos: ["Videos", "video", "videos"], images: ["Images", "image", "images"] } as const;

/** The two meters for Billing (SPEC-327); null when the backend sent none. Pure. */
export function toMedia(api: ApiAllowance): MediaView | null {
  const media = api.media;
  if (!media) return null;
  const rows = (["videos", "images"] as const).map((key): MediaRow => {
    const meter = media[key];
    const [label, one, many] = MEDIA_LABEL[key];
    const noun = (n: number) => (n === 1 ? one : many);
    if (meter.limit === null) {
      return { key, label, summary: `${meter.used} ${noun(meter.used)} made`, extra: null, percent: null, tone: "muted", noLimit: true };
    }
    const allowance = meter.limit + meter.granted;
    const percent = allowance > 0 ? Math.min(100, Math.round((meter.used / allowance) * 100)) : meter.used > 0 ? 100 : 0;
    return {
      key,
      label,
      summary: `${meter.used} of ${allowance} ${noun(allowance)} used`,
      extra: meter.granted > 0 ? `+${meter.granted} extra this month` : null,
      percent,
      // SPEC-374: "running low" starts at 60% (the $120 point on a $200 plan — the figure is never shown).
    tone: percent >= 100 ? "destructive" : percent >= 60 ? "warning" : "success",
      noLimit: false,
    };
  });
  return { unmetered: media.unmetered, rows };
}

export interface PlanOption {
  key: string;
  name: string;
  band: string;
  price: string;
  interval: string;
  aiAllowance: string;
  /** SPEC-373: "10 seats" / "Unlimited seats", or "" on an older backend. */
  seats: string;
}

export function money(cents: number, currency: string): string {
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${code} ${(cents / 100).toFixed(2)}`;
  }
}

function interval(value: string): string {
  return value === "year" ? "year" : "month";
}

const SUBSCRIPTION_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  past_due: { label: "Payment due", tone: "warning" },
  canceled: { label: "Cancelled", tone: "muted" },
};

const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "success" },
  open: { label: "Due", tone: "warning" },
  draft: { label: "Draft", tone: "muted" },
  uncollectible: { label: "Unpaid", tone: "destructive" },
  void: { label: "Void", tone: "muted" },
};

export function toSubscription(api: ApiSubscription, plans: ApiPlan[]): SubscriptionView {
  const plan = plans.find((p) => p.key === api.plan_key);
  const status = SUBSCRIPTION_STATUS[api.status] ?? { label: api.status, tone: "muted" as const };
  return {
    planKey: api.plan_key,
    planName: plan?.name ?? api.plan_key,
    band: plan?.band_label ?? null,
    price: money(api.price_cents, api.currency),
    interval: interval(api.interval),
    status: api.status,
    statusLabel: status.label,
    statusTone: status.tone,
    paidThroughStripe: api.provider === "stripe",
    renewsAt: api.current_period_end,
    startedAt: api.started_at,
  };
}

export function toInvoice(api: ApiInvoice): InvoiceView {
  const status = INVOICE_STATUS[api.status] ?? { label: api.status, tone: "muted" as const };
  return {
    id: api.id,
    number: api.number ?? "—",
    createdAt: api.created_at,
    description: api.description ?? "Subscription",
    amount: money(api.amount_cents, api.currency),
    status: api.status,
    statusLabel: status.label,
    statusTone: status.tone,
    url: api.hosted_url,
  };
}

export function allowancePercent(used: number, allowance: number): number {
  if (allowance <= 0) return used > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((used / allowance) * 100)));
}

export function toAllowance(api: ApiAllowance, currency = "USD"): AllowanceView {
  const percent = allowancePercent(api.used_cents, api.allowance_cents);
  return {
    unmetered: api.unmetered,
    allowance: money(api.allowance_cents, currency),
    used: money(api.used_cents, currency),
    remaining: money(Math.max(0, api.remaining_cents), currency),
    ownKeys: money(api.own_key_cents, currency),
    hasOwnKeyUse: api.own_key_cents > 0,
    topupCents: api.topup_cents ?? 0,
    topup: money(api.topup_cents ?? 0, currency),
    percent,
    // SPEC-374: "running low" starts at 60% (the $120 point on a $200 plan — the figure is never shown).
    tone: percent >= 100 ? "destructive" : percent >= 60 ? "warning" : "success",
    resetsAt: api.resets_at,
  };
}

export function toPlanOptions(plans: ApiPlan[]): PlanOption[] {
  return plans.map((p) => ({
    key: p.key,
    name: p.name,
    band: p.band_label,
    price: money(p.price_cents, p.currency),
    interval: interval(p.interval),
    aiAllowance: money(p.ai_allowance_cents, p.currency),
    seats: seatsLabel(p.seats),
  }));
}

export interface ApiTopupPacks {
  packs: { credit_cents: number; price_cents: number; currency: string }[];
  markup: number;
}

export interface TopupPack {
  creditCents: number;
  credit: string;
  price: string;
}

/** The AI credit packs the owner can buy, each with its 3x price (SPEC-384). */
export function toTopupPacks(api: ApiTopupPacks): TopupPack[] {
  return api.packs.map((p) => ({
    creditCents: p.credit_cents,
    credit: money(p.credit_cents, p.currency),
    price: money(p.price_cents, p.currency),
  }));
}

/** The seats a plan includes, as a label. Absent (older backend) → ""; null → "Unlimited seats". */
export function seatsLabel(seats: number | null | undefined): string {
  if (seats === undefined) return "";
  if (seats === null) return "Unlimited seats";
  return `${seats} ${seats === 1 ? "seat" : "seats"}`;
}

/** The words to show when the Stripe portal cannot open — the backend's own reason. */
export function portalFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "no_payment_account") return "There is no card on file yet. Choose a plan to add one.";
    if (error.code === "payments_not_configured") return "Payments are not set up on this platform yet.";
    if (error.message) return error.message;
  }
  return "Stripe could not be reached. Try again in a minute.";
}
