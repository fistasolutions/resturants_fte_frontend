/**
 * Email Marketing Manager — the pure half (SPEC-345). Tabs, money, the profit-per-send
 * estimate, incremental lift from a holdout, the guardrail checks and the approval they
 * fold into, quiet hours, the frequency cap, subject-line scoring, the brand-voice check,
 * flow-gap pricing and every status → chip decision. No React, no fetch: Vitest proves it,
 * and the send button and the pre-send panel read the same functions, so they can never
 * disagree about whether a send may go.
 */
import type { StatusTone } from "@/components/shared/status-badge";
import type { StripTile, StripTone } from "@/lib/kpi-strip";
import type {
  AutonomyLevel,
  CampaignGoal,
  CampaignStatus,
  FlowHealth,
  FlowStatus,
  Guardrails,
  Money,
  MoneyStrip,
  OfferKind,
  ProfitEstimate,
  VoiceRules,
} from "@/types/email-marketing";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/utils/format";

// ── Tabs ─────────────────────────────────────────────────────────────────────

export const EMAIL_MARKETING_BASE = "/email-marketing";

/** The sidebar title verbatim — the header, breadcrumb and doc are pinned to it. */
export const EMAIL_MARKETING_TITLE = "Email Marketing Manager";

export const EMAIL_TAB_IDS = [
  "overview",
  "plan",
  "campaigns",
  "flows",
  "audiences",
  "content",
  "approvals",
  "performance",
  "deliverability",
  "chat",
  "settings",
] as const;

export type EmailTab = (typeof EMAIL_TAB_IDS)[number];

export const EMAIL_TAB_LABELS: Record<EmailTab, string> = {
  overview: "Overview",
  plan: "Plan",
  campaigns: "Campaigns",
  flows: "Flows",
  audiences: "Audiences",
  content: "Content",
  approvals: "Approvals",
  performance: "Performance",
  deliverability: "Deliverability",
  chat: "Chat",
  settings: "Settings",
};

export function normalizeEmailTab(value: string | null | undefined): EmailTab {
  return EMAIL_TAB_IDS.includes(value as EmailTab) ? (value as EmailTab) : "overview";
}

export function emailTabHref(tab: EmailTab, extra?: Record<string, string>): string {
  const params = new URLSearchParams(tab === "overview" ? {} : { tab });
  for (const [key, value] of Object.entries(extra ?? {})) params.set(key, value);
  const query = params.toString();
  return query ? `${EMAIL_MARKETING_BASE}?${query}` : EMAIL_MARKETING_BASE;
}

export function builderHref(prefill?: { goal?: CampaignGoal; audience?: string; from?: string }): string {
  const params = new URLSearchParams();
  if (prefill?.goal) params.set("goal", prefill.goal);
  if (prefill?.audience) params.set("audience", prefill.audience);
  if (prefill?.from) params.set("from", prefill.from);
  const query = params.toString();
  return `${EMAIL_MARKETING_BASE}/campaigns/new${query ? `?${query}` : ""}`;
}

// ── Money and rates ──────────────────────────────────────────────────────────

export function money(amount: number, currency = "USD"): Money {
  return { amount: Math.round(amount), currency };
}

/** Minor units → the app's currency text. */
export function formatMoney(value: Money, compact = false): string {
  const major = value.amount / 100;
  return compact ? formatCompactCurrency(major) : formatCurrency(major);
}

export function formatMoneyRange(estimate: ProfitEstimate): string {
  if (estimate.low.amount === estimate.high.amount) return formatMoney(estimate.low);
  return `${formatMoney(estimate.low)} to ${formatMoney(estimate.high)}`;
}

/** n of d as a percent (0–100); 0 when d is 0. */
export function rate(n: number, d: number): number {
  return d > 0 ? (n / d) * 100 : 0;
}

/** A small rate with the precision it needs: 0.08% stays 0.08%, 12.3% stays 12.3%. */
export function formatRate(percent: number): string {
  const digits = percent < 1 ? 2 : 1;
  return `${percent.toFixed(digits)}%`;
}

export type Band = "good" | "warn" | "bad";

/**
 * Healthy bands for list-health rates. Spam follows the Gmail and Yahoo bulk-sender rules
 * (stay under 0.3%, aim under 0.1%); unsubscribes and bounces follow common practice.
 */
export const RATE_BANDS = {
  spam: { good: 0.1, bad: 0.3 },
  unsubscribe: { good: 0.3, bad: 0.5 },
  bounce: { good: 2, bad: 5 },
} as const;

export function band(kind: keyof typeof RATE_BANDS, percent: number): Band {
  const limits = RATE_BANDS[kind];
  if (percent >= limits.bad) return "bad";
  if (percent >= limits.good) return "warn";
  return "good";
}

export function bandLabel(kind: keyof typeof RATE_BANDS): string {
  const limits = RATE_BANDS[kind];
  return `healthy under ${formatRate(limits.good)}, act above ${formatRate(limits.bad)}`;
}

// ── Profit per send ──────────────────────────────────────────────────────────

export interface ProfitInput {
  recipients: number;
  holdoutPercent: number;
  /** Average order value, minor units. */
  aov: number;
  /** Gross margin of the products, before any discount (0–100). */
  marginPercent: number;
  /** Discount on the order (0–100); 0 for none. */
  discountPercent: number;
  /** Share of recipients who buy anyway, without the email (0–100). */
  baselineConversion: number;
  /** Share who buy with the email, low and high case (0–100). */
  conversionLow: number;
  conversionHigh: number;
  /** Platform cost per recipient, minor units. */
  sendCost: number;
  currency?: string;
}

function profitAt(input: ProfitInput, conversion: number): number {
  const treated = input.recipients * (1 - input.holdoutPercent / 100);
  const m = input.marginPercent / 100;
  const d = input.discountPercent / 100;
  const base = input.baselineConversion / 100;
  const extra = Math.max(0, conversion / 100 - base);
  // Each extra order keeps the margin left after the discount; every order that would
  // have happened anyway now carries the discount too — the margin a blanket code gives away.
  const earned = treated * extra * input.aov * (m - d);
  const givenAway = treated * base * input.aov * d;
  return earned - givenAway - treated * input.sendCost;
}

/**
 * Expected profit of a send — incremental, not attributed: only the orders the email
 * causes earn, and a discount is charged on the orders that would have come anyway. A
 * 20%-off code on a 22%-margin product therefore shows as losing money, which is the point.
 */
export function profitEstimate(input: ProfitInput): ProfitEstimate {
  const currency = input.currency ?? "USD";
  const low = profitAt(input, input.conversionLow);
  const high = profitAt(input, input.conversionHigh);
  const parts = [
    `${formatNumber(Math.round(input.recipients * (1 - input.holdoutPercent / 100)))} sent`,
    `${input.conversionLow}–${input.conversionHigh}% buy with the email vs ${input.baselineConversion}% without`,
    `${formatCurrency(input.aov / 100)} average order`,
    `${input.marginPercent}% margin`,
  ];
  if (input.discountPercent > 0) parts.push(`${input.discountPercent}% off`);
  return {
    low: money(Math.min(low, high), currency),
    high: money(Math.max(low, high), currency),
    basis: parts.join(" · "),
  };
}

/** What a discount hands out across every order it touches, minor units. */
export function discountCost(input: ProfitInput): Money {
  const treated = input.recipients * (1 - input.holdoutPercent / 100);
  const orders = treated * (input.conversionHigh / 100);
  return money(orders * input.aov * (input.discountPercent / 100), input.currency ?? "USD");
}

/** Margin left on a product once the discount comes off its price (0–100). */
export function marginAfterDiscount(marginPercent: number, discountPercent: number): number {
  if (discountPercent >= 100) return -100;
  const cost = 100 - marginPercent;
  const price = 100 - discountPercent;
  return ((price - cost) / price) * 100;
}

// ── Incremental lift ─────────────────────────────────────────────────────────

export interface HoldoutResult {
  treatedSize: number;
  treatedOrders: number;
  controlSize: number;
  controlOrders: number;
  /** Average order value, minor units. */
  aov: number;
  currency?: string;
}

export interface Lift {
  treatedRate: number;
  controlRate: number;
  /** Relative lift, percent. */
  liftPercent: number;
  incrementalOrders: number;
  incrementalRevenue: Money;
  /** A two-proportion z-test at 95%. */
  confident: boolean;
}

export function incrementalLift(result: HoldoutResult): Lift {
  const treatedRate = result.treatedSize > 0 ? result.treatedOrders / result.treatedSize : 0;
  const controlRate = result.controlSize > 0 ? result.controlOrders / result.controlSize : 0;
  const incrementalOrders = Math.max(0, Math.round((treatedRate - controlRate) * result.treatedSize));
  const pooled =
    result.treatedSize + result.controlSize > 0
      ? (result.treatedOrders + result.controlOrders) / (result.treatedSize + result.controlSize)
      : 0;
  const se =
    result.treatedSize > 0 && result.controlSize > 0
      ? Math.sqrt(pooled * (1 - pooled) * (1 / result.treatedSize + 1 / result.controlSize))
      : 0;
  const z = se > 0 ? (treatedRate - controlRate) / se : 0;
  return {
    treatedRate: treatedRate * 100,
    controlRate: controlRate * 100,
    liftPercent: controlRate > 0 ? ((treatedRate - controlRate) / controlRate) * 100 : 0,
    incrementalOrders,
    incrementalRevenue: money(incrementalOrders * result.aov, result.currency ?? "USD"),
    confident: z >= 1.96,
  };
}

/** The one-sentence verdict a campaign's results earn. */
export function liftVerdict(
  attributed: Money,
  incremental: Money | null,
  profit: Money | null,
  confident: boolean,
  providerName: string,
): string {
  if (!incremental) {
    return `${providerName} attributes ${formatMoney(attributed)} to this send. There was no holdout, so how much it caused is unknown.`;
  }
  const share = attributed.amount > 0 ? Math.round((incremental.amount / attributed.amount) * 100) : 0;
  const certainty = confident ? "" : " The holdout is small, so treat this as a direction, not a result.";
  const profitText = profit ? (profit.amount >= 0 ? `, ${formatMoney(profit)} profit` : `, a ${formatMoney({ ...profit, amount: -profit.amount })} loss`) : "";
  return `It caused ${formatMoney(incremental)} of the ${formatMoney(attributed)} ${providerName} attributes (${share}%)${profitText}.${certainty}`;
}

// ── Quiet hours and frequency ────────────────────────────────────────────────

/** Whether a local hour falls in quiet hours; the window may cross midnight. */
export function isQuietHour(hour: number, quiet: { start: number; end: number }): boolean {
  if (quiet.start === quiet.end) return false;
  return quiet.start < quiet.end ? hour >= quiet.start && hour < quiet.end : hour >= quiet.start || hour < quiet.end;
}

/** The first hour a send at `hour` may go out. */
export function nextAllowedHour(hour: number, quiet: { start: number; end: number }): number {
  return isQuietHour(hour, quiet) ? quiet.end : hour;
}

export function hourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}${suffix}`;
}

/** Profiles a send would push past the weekly cap — they are left out of it. */
export function overFrequencyCap(sentThisWeek: { sends: number; profiles: number }[], cap: number): number {
  return sentThisWeek.filter((row) => row.sends >= cap).reduce((sum, row) => sum + row.profiles, 0);
}

// ── Guardrails ───────────────────────────────────────────────────────────────

export type CheckStatus = "pass" | "warn" | "block";

export interface GuardrailCheck {
  key: string;
  label: string;
  status: CheckStatus;
  reason: string;
}

export interface SendCandidate {
  connected: boolean;
  killSwitch: boolean;
  recipients: number;
  offerKind: OfferKind;
  discountPercent: number;
  productMarginPercent: number | null;
  /** Protective segments (bracketers, complainers…) the audience still includes. */
  includedProtective: string[];
  sendHour: number | null;
  smartSend: boolean;
  sentToday: number;
  frequencyExcluded: number;
  seedTested: boolean;
  spamRate: number;
  voiceScore: number;
  bannedWords: string[];
  stockoutProducts: string[];
  /** SPEC-350: the store's own names for its protected groups ("Bracketers", …). */
  protectedNames?: string[];
  /** SPEC-350: a test exists, but for an older version of the campaign. */
  seedTestStale?: boolean;
  /** SPEC-350: the audience is Klaviyo lists or segments (no holdout, no per-person cap). */
  providerSend?: boolean;
  /** SPEC-350: chosen Klaviyo lists already at the weekly cap. */
  listsAtCap?: string[];
}

/** "Bracketers and high-return customers" from the store's own segment names (backend
 * `rules.protected_phrase`). */
export function protectedPhrase(names: readonly string[] | undefined): string {
  if (!names || names.length === 0) return "Bracketers and high-return customers";
  const parts = [names[0], ...names.slice(1).map((n) => n.charAt(0).toLowerCase() + n.slice(1))];
  return parts.length <= 2 ? parts.join(" and ") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function guardrailChecks(c: SendCandidate, g: Guardrails): GuardrailCheck[] {
  const checks: GuardrailCheck[] = [];
  checks.push(
    c.connected
      ? { key: "connection", label: "Email platform", status: "pass", reason: "Connected." }
      : { key: "connection", label: "Email platform", status: "block", reason: "Not connected — connect it in Settings." },
  );
  // SPEC-375 patch: there is no kill switch on screen any more; a store paused before that sees
  // why nothing can go, and no row at all otherwise.
  if (c.killSwitch) {
    checks.push({ key: "kill", label: "Paused", status: "block", reason: "Everything is paused. Resume it on Settings first." });
  }
  const discounting = c.offerKind === "discount" || c.offerKind === "unique_codes";
  if (discounting) {
    checks.push(
      c.discountPercent > g.maxDiscountPercent
        ? { key: "discount", label: "Discount", status: "block", reason: `${c.discountPercent}% is over your ${g.maxDiscountPercent}% limit.` }
        : { key: "discount", label: "Discount", status: "pass", reason: `${c.discountPercent}% — within your ${g.maxDiscountPercent}% limit.` },
    );
    if (c.productMarginPercent !== null) {
      const left = marginAfterDiscount(c.productMarginPercent, c.discountPercent);
      checks.push(
        left < g.marginFloorPercent
          ? {
              key: "margin",
              label: "Margin floor",
              status: "block",
              reason: `${Math.round(left)}% margin left after the discount — under your ${g.marginFloorPercent}% floor.`,
            }
          : { key: "margin", label: "Margin floor", status: "pass", reason: `${Math.round(left)}% margin left after the discount.` },
      );
    }
    checks.push(
      c.includedProtective.length > 0
        ? {
            key: "protective",
            label: "Protected groups",
            status: "block",
            reason: `A discount would reach ${c.includedProtective.join(", ")}. Exclude them.`,
          }
        : { key: "protective", label: "Protected groups", status: "pass", reason: `${protectedPhrase(c.protectedNames)} are left out.` },
    );
  }
  checks.push(
    c.recipients > g.maxAudienceWithoutSecondApproval
      ? {
          key: "audience",
          label: "Audience size",
          status: "warn",
          reason: `${formatNumber(c.recipients)} recipients — over ${formatNumber(g.maxAudienceWithoutSecondApproval)}, so you type the count to confirm.`,
        }
      : { key: "audience", label: "Audience size", status: "pass", reason: `${formatNumber(c.recipients)} recipients.` },
  );
  checks.push(
    c.sentToday + c.recipients > g.dailySendCeiling
      ? {
          key: "ceiling",
          label: "Daily ceiling",
          status: "block",
          reason: `${formatNumber(c.sentToday + c.recipients)} today would pass your ${formatNumber(g.dailySendCeiling)} ceiling.`,
        }
      : { key: "ceiling", label: "Daily ceiling", status: "pass", reason: `${formatNumber(c.sentToday + c.recipients)} of ${formatNumber(g.dailySendCeiling)} today.` },
  );
  if (c.sendHour !== null && !c.smartSend && isQuietHour(c.sendHour, g.quietHours)) {
    checks.push({
      key: "quiet",
      label: "Quiet hours",
      status: "warn",
      reason: `${hourLabel(c.sendHour)} is in quiet hours (${hourLabel(g.quietHours.start)}–${hourLabel(g.quietHours.end)}); each customer gets it at ${hourLabel(nextAllowedHour(c.sendHour, g.quietHours))} their time.`,
    });
  } else {
    checks.push({ key: "quiet", label: "Quiet hours", status: "pass", reason: "Lands outside quiet hours in each customer's timezone." });
  }
  checks.push(
    c.listsAtCap && c.listsAtCap.length > 0
      ? {
          key: "frequency",
          label: "Frequency cap",
          status: "block",
          reason: `${c.listsAtCap.join(", ")} already had ${g.frequencyCapPerWeek} emails this week — pick another audience or wait.`,
        }
      : c.frequencyExcluded > 0
      ? {
          key: "frequency",
          label: "Frequency cap",
          status: "pass",
          reason: `${formatNumber(c.frequencyExcluded)} already had ${g.frequencyCapPerWeek} emails this week and are left out.`,
        }
      : { key: "frequency", label: "Frequency cap", status: "pass", reason: `Nobody passes ${g.frequencyCapPerWeek} a week.` },
  );
  if (g.requireSeedTest) {
    checks.push(
      c.seedTested
        ? { key: "seed", label: "Test send", status: "pass", reason: "Sent to your seed list." }
        : c.seedTestStale
          ? { key: "seed", label: "Test send", status: "block", reason: "Edited since the last test — send a new test." }
          : { key: "seed", label: "Test send", status: "block", reason: "Send a test to your seed list first." },
    );
  }
  if (c.providerSend) {
    checks.push({
      key: "holdout",
      label: "Holdout",
      status: "warn",
      reason: "A Klaviyo list cannot be split, so nobody is held out — this send's real effect cannot be measured.",
    });
  }
  const spam = band("spam", c.spamRate);
  checks.push(
    spam === "bad"
      ? { key: "deliverability", label: "Deliverability", status: "block", reason: `Spam rate ${formatRate(c.spamRate)} — at Gmail and Yahoo's limit. Fix the list first.` }
      : spam === "warn"
        ? { key: "deliverability", label: "Deliverability", status: "warn", reason: `Spam rate ${formatRate(c.spamRate)} — above the 0.10% to aim for.` }
        : { key: "deliverability", label: "Deliverability", status: "pass", reason: `Spam rate ${formatRate(c.spamRate)}.` },
  );
  checks.push(
    c.bannedWords.length > 0
      ? { key: "voice", label: "Brand voice", status: "block", reason: `Uses words your Brand Brain bans: ${c.bannedWords.join(", ")}.` }
      : c.voiceScore < 70
        ? { key: "voice", label: "Brand voice", status: "warn", reason: `Scores ${c.voiceScore} — under 70 reads off-brand.` }
        : { key: "voice", label: "Brand voice", status: "pass", reason: `Scores ${c.voiceScore}.` },
  );
  checks.push(
    c.stockoutProducts.length > 0
      ? { key: "stock", label: "Stock", status: "block", reason: `Promotes ${c.stockoutProducts.join(", ")}, at stockout risk.` }
      : { key: "stock", label: "Stock", status: "pass", reason: "Every product shown has the stock to sell." },
  );
  return checks;
}

export interface Readiness {
  ready: boolean;
  blockers: GuardrailCheck[];
  warnings: GuardrailCheck[];
  /** Over the audience threshold: the owner types the recipient count to send. */
  needsTypedConfirm: boolean;
}

export function approvalReadiness(checks: GuardrailCheck[]): Readiness {
  const blockers = checks.filter((check) => check.status === "block");
  const warnings = checks.filter((check) => check.status === "warn");
  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    needsTypedConfirm: checks.some((check) => check.key === "audience" && check.status === "warn"),
  };
}

/** The typed confirmation matches the recipient count, with or without separators. */
export function typedConfirmMatches(typed: string, recipients: number): boolean {
  const digits = typed.replace(/[\s,.'_]/g, "");
  return digits.length > 0 && Number(digits) === recipients;
}

// ── Subject lines ────────────────────────────────────────────────────────────

const SPAMMY = ["free!!!", "act now", "100% free", "risk-free", "winner", "click here", "$$$", "urgent", "guarantee"];

export interface SubjectScore {
  score: number;
  notes: string[];
}

/**
 * A subject line's score (0–100) from rules that hold across stores: length, spam
 * triggers, shouting, a specific number, the preview text adding something new. The
 * store's own learnings (Performance) add their measured lift on top.
 */
export function scoreSubject(subject: string, preview: string, learnedBoost = 0): SubjectScore {
  const notes: string[] = [];
  let score = 70;
  const length = subject.trim().length;
  if (length === 0) return { score: 0, notes: ["Write a subject line."] };
  if (length >= 28 && length <= 50) {
    score += 10;
    notes.push(`${length} characters — reads in full on a phone.`);
  } else if (length > 60) {
    score -= 15;
    notes.push(`${length} characters — a phone cuts it after about 40.`);
  } else if (length < 15) {
    score -= 10;
    notes.push("Very short — say what is in it.");
  } else {
    notes.push(`${length} characters.`);
  }
  const lower = subject.toLowerCase();
  const spam = SPAMMY.filter((word) => lower.includes(word));
  if (spam.length > 0) {
    score -= 20;
    notes.push(`Spam-filter words: ${spam.join(", ")}.`);
  }
  const letters = subject.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 8 && letters === letters.toUpperCase()) {
    score -= 15;
    notes.push("All capitals reads as shouting.");
  }
  if ((subject.match(/!/g) ?? []).length > 1) {
    score -= 10;
    notes.push("More than one exclamation mark.");
  }
  if (/\d/.test(subject)) {
    score += 5;
    notes.push("A specific number helps.");
  }
  const previewText = preview.trim();
  if (previewText.length === 0) {
    score -= 10;
    notes.push("Add preview text — otherwise the inbox shows the first line of the email.");
  } else if (previewText.toLowerCase() === lower) {
    score -= 10;
    notes.push("Preview text repeats the subject — use it to add something new.");
  } else if (previewText.length >= 35 && previewText.length <= 90) {
    score += 5;
  }
  if (learnedBoost !== 0) {
    score += learnedBoost;
    notes.push(`${learnedBoost > 0 ? "+" : ""}${learnedBoost} from what wins for this store.`);
  }
  return { score: Math.max(0, Math.min(100, Math.round(score))), notes };
}

// ── Brand voice ──────────────────────────────────────────────────────────────

/** A banned word caps the score here whatever else is right (Brand Brain's gate). */
export const VOICE_GATE_CAP = 59;

export interface VoiceCheck {
  score: number;
  banned: string[];
  claims: string[];
  notes: string[];
}

function wordsIn(text: string, phrases: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return phrases.filter((phrase) => {
    const escaped = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`).test(lower);
  });
}

/** The same model as Brand Brain's rulebook: banned words cap the score, unsupported
 * claims cost points, very long sentences read off-voice. */
export function voiceCheck(text: string, rules: VoiceRules): VoiceCheck {
  const banned = wordsIn(text, rules.bannedWords);
  const claims = wordsIn(text, rules.claims);
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const long = sentences.filter((s) => s.split(/\s+/).length > 28).length;
  const notes: string[] = [];
  let score = 96 - claims.length * 12 - long * 6;
  if (claims.length > 0) notes.push(`Claims to support or remove: ${claims.join(", ")}.`);
  if (long > 0) notes.push(`${long} sentence${long === 1 ? "" : "s"} over 28 words.`);
  if (banned.length > 0) {
    notes.push(`Banned by your Brand Brain: ${banned.join(", ")}.`);
    score = Math.min(score, VOICE_GATE_CAP);
  }
  if (notes.length === 0) notes.push("On voice: no banned words, no unsupported claims.");
  return { score: Math.max(0, Math.round(score)), banned, claims, notes };
}

// ── Flow gaps ────────────────────────────────────────────────────────────────

/**
 * What a missing or weak flow is worth a month: the profiles who would enter it, times
 * the revenue per recipient a healthy version earns, times the margin kept — profit,
 * not revenue.
 */
export function flowGapMonthly(eligiblePerMonth: number, healthyRpr: Money, marginPercent: number): Money {
  return money(eligiblePerMonth * healthyRpr.amount * (marginPercent / 100), healthyRpr.currency);
}

// ── Status → chip ────────────────────────────────────────────────────────────

const CAMPAIGN_CHIPS: Record<CampaignStatus, { label: string; tone: StatusTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  in_review: { label: "In review", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "info" },
  sending: { label: "Sending", tone: "ai" },
  sent: { label: "Sent", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  failed: { label: "Failed", tone: "destructive" },
};

export function campaignChip(status: CampaignStatus): { label: string; tone: StatusTone } {
  return CAMPAIGN_CHIPS[status];
}

export const CAMPAIGN_STATUS_ORDER: readonly CampaignStatus[] = [
  "in_review",
  "scheduled",
  "sending",
  "draft",
  "sent",
  "failed",
  "cancelled",
];

const FLOW_CHIPS: Record<FlowStatus, { label: string; tone: StatusTone }> = {
  live: { label: "Live", tone: "success" },
  manual: { label: "Manual", tone: "info" },
  draft: { label: "Draft", tone: "neutral" },
  missing: { label: "Missing", tone: "warning" },
};

export function flowChip(status: FlowStatus): { label: string; tone: StatusTone } {
  return FLOW_CHIPS[status];
}

const HEALTH_TONES: Record<FlowHealth, StatusTone> = {
  healthy: "success",
  weak: "warning",
  broken: "destructive",
  missing: "neutral",
};

export function healthTone(health: FlowHealth): StatusTone {
  return HEALTH_TONES[health];
}

export function checkTone(status: CheckStatus): StatusTone {
  return status === "block" ? "destructive" : status === "warn" ? "warning" : "success";
}

// ── Autonomy and goals ───────────────────────────────────────────────────────

export const AUTONOMY: Record<AutonomyLevel, { label: string; detail: string }> = {
  suggest: { label: "Suggest", detail: "Ideas only. Nothing is built in your email platform." },
  draft: { label: "Draft", detail: "Builds campaigns and flows in your email platform as drafts. Nothing sends." },
  approve: { label: "Approve to send", detail: "Builds everything; nothing leaves without your click. Recommended." },
  autopilot: {
    label: "Autopilot within guardrails",
    detail: "Sends on its own — only for programs you switch on, and only inside your guardrails.",
  },
};

export const AUTONOMY_ORDER: readonly AutonomyLevel[] = ["suggest", "draft", "approve", "autopilot"];

/** Each goal's default audience is a backend segment key (SPEC-354 `SEGMENT_META`); an empty
 * one means "the store's own email-platform list" — the builder picks its largest. */
export const GOALS: Record<CampaignGoal, { label: string; detail: string; audience: string; offer: OfferKind }> = {
  sell_through: {
    label: "Sell through overstock",
    detail: "Move stock that is sitting, with a markdown that keeps the margin floor.",
    audience: "discount-only",
    offer: "discount",
  },
  launch: { label: "Launch", detail: "Introduce something new to the customers most likely to want it.", audience: "vip", offer: "none" },
  win_back: { label: "Win back", detail: "Bring back customers who are past their usual time to reorder.", audience: "going-quiet", offer: "discount" },
  vip_early_access: { label: "VIP early access", detail: "Your best customers first, before everyone else.", audience: "vip", offer: "none" },
  newsletter: { label: "Content newsletter", detail: "The latest post and what is new — no discount needed.", audience: "", offer: "none" },
  back_in_stock: { label: "Back in stock", detail: "Tell the people who wanted it that it is back.", audience: "due-reorder", offer: "none" },
  custom: { label: "Custom", detail: "Start from a blank brief.", audience: "", offer: "none" },
};

export const GOAL_ORDER: readonly CampaignGoal[] = [
  "sell_through",
  "launch",
  "win_back",
  "vip_early_access",
  "newsletter",
  "back_in_stock",
  "custom",
];

export function isGoal(value: string | null | undefined): value is CampaignGoal {
  return GOAL_ORDER.includes(value as CampaignGoal);
}

/** Hours since the reporting snapshot, and whether it is old enough to say so. */
export function snapshotAge(takenAt: string, now: Date = new Date()): { hours: number; stale: boolean } {
  const hours = Math.max(0, (now.getTime() - new Date(takenAt).getTime()) / 3_600_000);
  return { hours: Math.round(hours), stale: hours > 36 };
}

// ── The money strip ──────────────────────────────────────────────────────────

const BAND_TONE: Record<Band, StripTone> = { good: "good", warn: "warn", bad: "bad" };

/** The Overview's six tiles — what email caused, what it kept, and whether the list is healthy. */
export function overviewTiles(strip: MoneyStrip, providerName: string): StripTile[] {
  const share = strip.attributed30d.amount > 0 ? Math.round((strip.incremental30d.amount / strip.attributed30d.amount) * 100) : 0;
  return [
    {
      key: "incremental",
      label: "Sales email caused · 30d",
      value: formatMoney(strip.incremental30d, true),
      delta: null,
      invertDelta: false,
      sub: `${share}% of ${formatMoney(strip.attributed30d, true)} ${providerName} attributes`,
      tone: "neutral",
    },
    {
      key: "profit",
      label: "Profit from email · 30d",
      value: formatMoney(strip.profit30d, true),
      delta: null,
      invertDelta: false,
      sub: "after product, discount and sending cost",
      tone: strip.profit30d.amount >= 0 ? "good" : "bad",
    },
    {
      key: "rpr",
      label: "Revenue per recipient",
      value: formatMoney(strip.revenuePerRecipient),
      delta: null,
      invertDelta: false,
      sub: "attributed, campaigns and flows",
      tone: "neutral",
    },
    {
      key: "list",
      label: "List",
      value: formatNumber(strip.listSize),
      delta: null,
      invertDelta: false,
      sub: `${strip.listGrowth30d >= 0 ? "+" : ""}${formatNumber(strip.listGrowth30d)} in 30 days`,
      tone: "neutral",
    },
    {
      key: "unsubscribe",
      label: "Unsubscribe rate",
      value: formatRate(strip.unsubscribeRate),
      delta: null,
      invertDelta: false,
      sub: bandLabel("unsubscribe"),
      tone: BAND_TONE[band("unsubscribe", strip.unsubscribeRate)],
    },
    {
      key: "spam",
      label: "Spam rate",
      value: formatRate(strip.spamRate),
      delta: null,
      invertDelta: false,
      sub: bandLabel("spam"),
      tone: BAND_TONE[band("spam", strip.spamRate)],
    },
  ];
}

/** The campaigns list, filtered by status and a name search — the pure half of the Campaigns
 * tab (SPEC-345 patch 2026-10-14), so pagination and search are unit-testable. Already sorted. */
export function filterCampaigns<T extends { name: string; status: CampaignStatus }>(
  all: readonly T[],
  status: "all" | CampaignStatus,
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  return all.filter(
    (c) => (status === "all" || c.status === status) && (q === "" || c.name.toLowerCase().includes(q)),
  );
}

/** How many campaigns to show per page on the Campaigns tab. */
export const CAMPAIGNS_PAGE_SIZE = 20;

/** Rows whose name contains the (trimmed, case-insensitive) query — the pure half of the search
 * on the Audiences tab's provider lists (SPEC-345 patch 2026-10-14). Empty query keeps all. */
export function filterByName<T extends { name: string }>(rows: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  return q === "" ? [...rows] : rows.filter((r) => r.name.toLowerCase().includes(q));
}
