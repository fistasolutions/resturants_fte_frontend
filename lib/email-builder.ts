/**
 * The campaign builder's pure half (SPEC-345, backend SPEC-354): the draft, its seven steps
 * and what each needs before the next, a live upper bound on recipients while editing, the
 * profit inputs a goal implies, subject variants, and the draft → the body the backend saves.
 * Once saved, the server's own estimate, exclusions and checks replace everything here — the
 * review step reads `GET /campaigns/{id}/checks`, which is what approve is gated on.
 */
import { blocksProblem } from "@/lib/email-blocks";
import { spokenHour } from "@/lib/email-brain";
import { GOALS, money, profitEstimate, discountCost, scoreSubject, type ProfitInput, type SendCandidate } from "@/lib/email-marketing";
import type { CampaignInput } from "@/services/email-marketing-actions";
import type {
  Audience,
  BestTime,
  CampaignGoal,
  CatalogProduct,
  ContentBlock,
  EmailCampaign,
  EmailProviderKey,
  Exclusion,
  OfferKind,
  SendStrategy,
  SubjectVariant,
} from "@/types/email-marketing";

/** Klaviyo's allowed throttle rates: the share of recipients sent each hour. */
export const THROTTLE_PERCENTS = [1, 2, 5, 10, 11, 13, 14, 17, 20, 25, 33, 50] as const;

/** `YYYY-MM-DDTHH:MM`, no zone — a set-time send's wall clock in each customer's timezone. */
export function wallClock(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const BUILDER_STEPS = ["goal", "audience", "offer", "content", "test", "schedule", "review"] as const;
export type BuilderStep = (typeof BUILDER_STEPS)[number];

export const STEP_LABELS: Record<BuilderStep, string> = {
  goal: "Goal",
  audience: "Audience",
  offer: "Offer",
  content: "Content",
  test: "Test",
  schedule: "Schedule",
  review: "Review & approve",
};

export type TestKind = "none" | "subject" | "content" | "send_time";

export interface BuilderDraft {
  id: string;
  goal: CampaignGoal;
  name: string;
  audienceKeys: string[];
  excludedKeys: string[];
  offerKind: OfferKind;
  /** The existing Shopify code the email carries; ftes reads Shopify and never makes one. */
  discountCode: string | null;
  /** The chosen code's percent off (0 for a fixed-amount or free-shipping code). */
  discountPercent: number;
  productIds: number[];
  subject: string;
  previewText: string;
  variants: SubjectVariant[];
  blocks: ContentBlock[];
  testKind: TestKind;
  holdoutPercent: number;
  strategy: SendStrategy;
}

/** How this kind of send converts — from similar past sends; the backend reads the store's own. */
export const GOAL_RATES: Record<CampaignGoal, { base: number; low: number; high: number }> = {
  sell_through: { base: 1.2, low: 1.8, high: 2.4 },
  launch: { base: 0.9, low: 1.4, high: 1.9 },
  win_back: { base: 1.4, low: 3.2, high: 4.6 },
  vip_early_access: { base: 2.5, low: 4.5, high: 6 },
  newsletter: { base: 0.9, low: 1.0, high: 1.3 },
  back_in_stock: { base: 3, low: 9, high: 13 },
  custom: { base: 1, low: 1.3, high: 1.7 },
};

const GOAL_SUBJECTS: Record<CampaignGoal, [string, string][]> = {
  sell_through: [
    ["{product}, at a better price this week", "Fewer left than we ordered — here's why it's worth a look."],
    ["Pair it with {product} and save", "A bundle that makes sense, while stock lasts."],
    ["Last chance on {product}", "Once these go, they're gone for the season."],
  ],
  launch: [
    ["New: {product}", "Made in small batches. Here's what makes it different."],
    ["Meet {product}", "The first ones ship this week."],
    ["We made something new", "{product}, and the story behind it."],
  ],
  win_back: [
    ["It's been a while — here's something for you", "A code just for you, good for 7 days."],
    ["We saved your favourites", "Back in stock, and picked for you."],
    ["Still with us?", "A few things you might have missed."],
  ],
  vip_early_access: [
    ["You're first: {product}", "48 hours before everyone else."],
    ["Early access, just for you", "Our best customers see it first."],
    ["A private preview", "{product}, before it goes live."],
  ],
  newsletter: [
    ["What we made this month", "A new piece, a studio visit, and a few favourites."],
    ["From the journal: {post}", "Plus what's new in the shop."],
    ["This month in the shop", "Three things worth your time."],
  ],
  back_in_stock: [
    ["{product} is back", "You asked to hear first."],
    ["Back in stock: {product}", "All colours, while they last."],
    ["It's back — and it won't last", "{product} is restocked."],
  ],
  custom: [
    ["A note from us", "What's new and what's worth a look."],
    ["Something for you", "A short update from us."],
    ["This week in the shop", "What we've been working on."],
  ],
};

function fill(template: string, product: string, post: string): string {
  return template.replace("{product}", product).replace("{post}", post);
}

/** Three to five scored subject lines for a goal, best first. */
export function subjectVariants(goal: CampaignGoal, product: string, post: string): SubjectVariant[] {
  return GOAL_SUBJECTS[goal]
    .map(([subject, preview], i) => {
      const s = fill(subject, product, post);
      const p = fill(preview, product, post);
      const score = scoreSubject(s, p, /\b(new|back)\b/i.test(s) && product !== "" && s.includes(product) ? 6 : 0);
      return { id: `v${i + 1}`, subject: s, preview: p, score: score.score, notes: score.notes };
    })
    .sort((a, b) => b.score - a.score);
}

/** The opening blocks for a goal. The footer names the sender; the backend's renderer adds
 * the platform's unsubscribe link to it on every send. */
export function defaultBlocks(goal: CampaignGoal, productIds: number[], post: string | null, sender = ""): ContentBlock[] {
  const list: ContentBlock[] = [
    { id: "b-hero", kind: "hero", title: GOALS[goal].label, body: GOALS[goal].detail },
  ];
  if (productIds.length > 0) list.push({ id: "b-grid", kind: "product_grid", title: "Picked for you", body: "", productIds });
  if (goal === "newsletter" && post) list.push({ id: "b-blog", kind: "blog_teaser", title: "From the journal", body: post });
  const from = sender.trim();
  list.push({ id: "b-footer", kind: "footer", title: "Footer", body: from ? `${from} · You get this because you subscribed.` : "You get this because you subscribed." });
  return list;
}

/** The asked-for audience when it exists; otherwise the largest email-platform list, then the
 * largest group that is not protective. Never a key the server would refuse. */
export function defaultAudience(wanted: string, audiences: readonly Audience[] | undefined): string[] {
  if (!audiences) return wanted ? [wanted] : [];
  if (wanted && audiences.some((a) => a.key === wanted)) return [wanted];
  const bySize = [...audiences].filter((a) => !a.protective).sort((x, y) => y.consent.emailSubscribed - x.consent.emailSubscribed);
  const list = bySize.find((a) => a.source !== "fte") ?? bySize[0];
  return list ? [list.key] : [];
}

export function initialDraft(
  goal: CampaignGoal,
  opts: {
    id: string;
    excluded: string[];
    audience?: string | null;
    today: string;
    catalog: CatalogProduct[];
    post: string | null;
    sender?: string;
    /** What can be chosen; the default audience must be one of these. */
    audiences?: readonly Audience[];
  },
): BuilderDraft {
  const meta = GOALS[goal];
  const sellable = opts.catalog.filter((p) => !p.stockoutRisk);
  const productIds = goal === "newsletter" || goal === "custom" ? [] : sellable.slice(0, 3).map((p) => p.id);
  const lead = opts.catalog.find((p) => p.id === productIds[0])?.title ?? "";
  const variants = subjectVariants(goal, lead, opts.post ?? "");
  return {
    id: opts.id,
    goal,
    name: meta.label,
    audienceKeys: defaultAudience(opts.audience ?? meta.audience, opts.audiences),
    excludedKeys: [...opts.excluded],
    offerKind: meta.offer,
    discountCode: null,
    discountPercent: 0,
    productIds,
    subject: variants[0]?.subject ?? "",
    previewText: variants[0]?.preview ?? "",
    variants,
    blocks: defaultBlocks(goal, productIds, opts.post, opts.sender),
    testKind: "subject",
    holdoutPercent: 10,
    strategy: { kind: "smart", date: opts.today },
  };
}

export interface RecipientEstimate {
  /** At most this many: the chosen groups' consented profiles, before overlaps, exclusions
   * and the frequency cap — which only the server can count exactly. */
  recipients: number;
  exclusions: Exclusion[];
}

/**
 * A live upper bound while the draft is edited: the consented profiles of the chosen groups,
 * with everyone without email consent listed as left out. Consent is never overridden: only
 * `emailSubscribed` profiles can receive. Nothing here is guessed — overlaps, the excluded
 * groups and the frequency cap are counted by the server once the draft is saved.
 */
export function estimateRecipients(draft: BuilderDraft, audiences: readonly Audience[]): RecipientEstimate {
  const chosen = audiences.filter((a) => draft.audienceKeys.includes(a.key));
  if (chosen.length === 0) return { recipients: 0, exclusions: [] };
  const reachable = chosen.reduce((sum, a) => sum + a.consent.emailSubscribed, 0);
  const total = chosen.reduce((sum, a) => sum + a.size, 0);
  const gap = Math.max(0, total - reachable);
  return { recipients: reachable, exclusions: gap > 0 ? [{ reason: "Not subscribed, suppressed or without an email (consent)", count: gap }] : [] };
}

/** Protective groups a discount draft would still reach. */
export function includedProtective(draft: BuilderDraft, audiences: readonly Audience[]): string[] {
  return audiences.filter((a) => a.protective && draft.audienceKeys.includes(a.key)).map((a) => a.name);
}

/** The profit maths' inputs for a draft: the products' own price and margin. */
export function draftProfitInput(draft: BuilderDraft, recipients: number, catalog: readonly CatalogProduct[]): ProfitInput {
  const products = catalog.filter((p) => draft.productIds.includes(p.id));
  const aov = products.length > 0 ? products.reduce((s, p) => s + p.price.amount, 0) / products.length : 6_800;
  const margin = products.length > 0 ? products.reduce((s, p) => s + p.marginPercent, 0) / products.length : 52;
  const rates = GOAL_RATES[draft.goal];
  const discounting = draft.offerKind === "discount" && draft.discountPercent > 0;
  return {
    recipients,
    holdoutPercent: draft.holdoutPercent,
    aov: Math.round(aov),
    marginPercent: Math.round(margin),
    discountPercent: discounting ? draft.discountPercent : 0,
    baselineConversion: rates.base,
    conversionLow: rates.low,
    conversionHigh: rates.high,
    sendCost: 1,
    currency: "USD",
  };
}

/** What a step still needs before the next one, in the owner's words; null when ready. */
export function stepProblem(step: BuilderStep, draft: BuilderDraft, audiences: readonly Audience[] = []): string | null {
  switch (step) {
    case "goal":
      return draft.name.trim().length < 3 ? "Give the campaign a name." : null;
    case "audience": {
      if (draft.audienceKeys.length === 0) return "Choose who it goes to.";
      const sources = new Set(audiences.filter((a) => draft.audienceKeys.includes(a.key)).map((a) => a.source === "fte"));
      // The server refuses a mix: platform lists cannot be filtered by consent or exclusions here.
      return sources.size > 1 ? "Send to segments or to your email platform's lists — not both in one campaign." : null;
    }
    case "offer":
      if ((draft.offerKind === "discount" || draft.offerKind === "free_shipping") && !draft.discountCode) {
        return "Pick one of your Shopify codes, or choose no offer.";
      }
      return null;
    case "content":
      if (draft.subject.trim().length === 0) return "Write or pick a subject line.";
      if (!draft.blocks.some((b) => b.kind !== "footer")) return "Add at least one block above the footer.";
      return blocksProblem(draft.blocks);
    case "test":
      return draft.holdoutPercent < 0 || draft.holdoutPercent > 50 ? "Keep the holdout between 0% and 50%." : null;
    case "schedule":
      if (draft.strategy.kind === "throttled" && !(THROTTLE_PERCENTS as readonly number[]).includes(draft.strategy.percent)) {
        return `Klaviyo throttles by one of ${THROTTLE_PERCENTS.join("%, ")}% of the audience an hour.`;
      }
      return null;
    case "review":
      return null;
  }
}

/** The draft as the campaign the pre-send panel and the approval judge. */
export function draftToCampaign(
  draft: BuilderDraft,
  estimate: RecipientEstimate,
  catalog: readonly CatalogProduct[],
  provider: EmailProviderKey,
  voiceScore: number,
  createdAt: string,
): EmailCampaign {
  const input = draftProfitInput(draft, estimate.recipients, catalog);
  const products = catalog.filter((p) => draft.productIds.includes(p.id));
  const discounting = draft.offerKind === "discount" && draft.discountPercent > 0;
  return {
    id: draft.id,
    provider,
    externalId: null,
    name: draft.name.trim(),
    goal: draft.goal,
    status: "draft",
    message: { channel: "email", subject: draft.subject, previewText: draft.previewText, blocks: draft.blocks, templateId: null },
    audienceKeys: draft.audienceKeys,
    excludedKeys: draft.excludedKeys,
    recipientEstimate: estimate.recipients,
    exclusions: estimate.exclusions,
    offer: {
      kind: draft.offerKind,
      code: draft.offerKind === "none" ? null : draft.discountCode,
      percent: discounting ? draft.discountPercent : null,
      // The floor is judged on the thinnest-margin product, never the average.
      productMarginPercent: products.length > 0 ? Math.min(...products.map((p) => p.marginPercent)) : null,
      history: null,
    },
    strategy: draft.strategy,
    holdoutPercent: draft.holdoutPercent,
    variants: draft.testKind === "none" ? 1 : 2,
    brandVoiceScore: voiceScore,
    expectedProfit: profitEstimate(input),
    discountCost: discounting ? discountCost(input) : money(0),
    results: null,
    createdAt,
    sendAt: null,
    createdBy: "owner",
    verdict: null,
    source: "fte",
    lastError: null,
  };
}

/** A saved draft back into the builder, to edit it in place (`?edit=<id>`). */
export function campaignToDraft(c: EmailCampaign): BuilderDraft {
  const offerKind: OfferKind = c.offer.kind === "discount" || c.offer.kind === "free_shipping" ? c.offer.kind : "none";
  return {
    id: c.id,
    goal: c.goal,
    name: c.name,
    audienceKeys: [...c.audienceKeys],
    excludedKeys: [...c.excludedKeys],
    offerKind,
    discountCode: offerKind === "none" ? null : c.offer.code,
    discountPercent: offerKind === "none" ? 0 : (c.offer.percent ?? 0),
    productIds: c.message.blocks.flatMap((block) => block.productIds ?? []),
    subject: c.message.subject,
    previewText: c.message.previewText,
    variants: [],
    blocks: c.message.blocks,
    testKind: c.variants > 1 ? "subject" : "none",
    holdoutPercent: c.holdoutPercent,
    strategy: c.strategy,
  };
}

/** The draft as the body `POST`/`PUT /campaigns` saves — the server recomputes the estimate,
 * exclusions, profit and voice from it. */
export function draftToInput(draft: BuilderDraft): CampaignInput {
  return {
    name: draft.name.trim(),
    goal: draft.goal,
    subject: draft.subject.trim(),
    previewText: draft.previewText.trim(),
    blocks: draft.blocks,
    audienceKeys: draft.audienceKeys,
    excludedKeys: draft.excludedKeys,
    offer:
      (draft.offerKind === "discount" || draft.offerKind === "free_shipping") && draft.discountCode
        ? { kind: draft.offerKind, code: draft.discountCode }
        : { kind: "none" },
    strategy: draft.strategy,
    holdoutPercent: draft.holdoutPercent,
    variants: draft.testKind === "none" ? 1 : 2,
  };
}

/** The send hour a strategy implies (null for smart send time, which picks per profile, and for
 * the audience's best time, which only the server resolves — its checks judge that hour). */
export function strategyHour(strategy: SendStrategy, now: Date = new Date()): number | null {
  switch (strategy.kind) {
    case "immediate":
      return now.getHours();
    case "static":
    case "throttled":
      return new Date(strategy.at).getHours();
    case "smart":
    case "best_time":
      return null;
  }
}

/** How a send's timing reads. For the audience's best time, `bestTime` (the server's checks)
 * names the hour; without it the label says only that the hour is the audience's own. */
export function strategyLabel(strategy: SendStrategy, bestTime?: BestTime | null): string {
  const at = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const day = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  switch (strategy.kind) {
    case "immediate":
      return "Send now";
    case "static":
      return `At ${at(strategy.at)}, in each customer's timezone`;
    case "smart":
      return `Smart send time on ${day(strategy.date)}`;
    case "best_time":
      return bestTime
        ? `Best time for this audience: ${spokenHour(bestTime.hour)} on ${day(strategy.date)}, in each customer's timezone`
        : `Best time for this audience on ${day(strategy.date)}`;
    case "throttled":
      return `From ${at(strategy.at)}, ${strategy.percent}% of the audience an hour`;
  }
}

export interface SendContext {
  connected: boolean;
  killSwitch: boolean;
  audiences: readonly Audience[];
  catalog: readonly CatalogProduct[];
  bannedWords: string[];
  sentToday: number;
  seedTested: readonly string[];
  spamRate: number;
}

/** Every word a campaign puts in front of a customer, for the brand-voice check. */
export function campaignText(campaign: EmailCampaign): string {
  return [campaign.message.subject, campaign.message.previewText, ...campaign.message.blocks.flatMap((b) => [b.title, b.body])].join(". ");
}

/** The protective segments the protected-groups check names, in order (backend SPEC-360). */
const PROTECTED_KEYS = ["bracketers", "high-return"] as const;

/** A campaign as the guardrails see it — the one input the builder, approvals and the
 * campaign page all judge a send by. */
export function sendCandidate(campaign: EmailCampaign, ctx: SendContext, now: Date = new Date()): SendCandidate {
  const text = campaignText(campaign).toLowerCase();
  const gridIds = campaign.message.blocks.flatMap((b) => b.productIds ?? []);
  return {
    connected: ctx.connected,
    killSwitch: ctx.killSwitch,
    recipients: campaign.recipientEstimate,
    offerKind: campaign.offer.kind,
    discountPercent: campaign.offer.percent ?? 0,
    productMarginPercent: campaign.offer.productMarginPercent,
    includedProtective: ctx.audiences.filter((a) => a.protective && campaign.audienceKeys.includes(a.key)).map((a) => a.name),
    sendHour: strategyHour(campaign.strategy, now),
    smartSend: campaign.strategy.kind === "smart",
    sentToday: ctx.sentToday,
    frequencyExcluded: campaign.exclusions.find((e) => /frequency cap/i.test(e.reason))?.count ?? 0,
    seedTested: ctx.seedTested.includes(campaign.id),
    spamRate: ctx.spamRate,
    voiceScore: campaign.brandVoiceScore,
    bannedWords: ctx.bannedWords.filter((word) => text.includes(word.toLowerCase())),
    stockoutProducts: ctx.catalog.filter((p) => p.stockoutRisk && gridIds.includes(p.id)).map((p) => p.title),
    // SPEC-350: the store's own names for its protected groups (backend `PROTECTED_KEYS`).
    protectedNames: PROTECTED_KEYS.map((key) => ctx.audiences.find((a) => a.key === key)?.name).filter(
      (name): name is string => Boolean(name),
    ),
    providerSend: campaign.audienceKeys.some((key) => key.startsWith("list-") || key.startsWith("segment-")),
  };
}
