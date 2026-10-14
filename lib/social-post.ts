/**
 * Social Growth — single-post view logic (SPEC-138). Pure and unit-testable: no
 * JSX, no data fetching. Shared by the reusable `PostDetail`/`PostCard`
 * components so the "is this post editable", the status/schedule vocabulary, and
 * the draft→detail mappings each have exactly one definition. Sibling to
 * `lib/social-studio.ts` / `lib/social-plan.ts`.
 */
import type {
  PendingPost,
  PostDetail,
  ProductCreative,
  ProductDraft,
  SlotGenerateResult,
  PlanSlot,
  StudioProduct,
} from "@/types/social";

/** The statuses a post can still be approved / sent back from — the only ones
 * that expose the Approve / Request-changes actions. */
export const EDITABLE_STATUSES = ["in_review", "changes_requested"] as const;

/** Whether a post is still awaiting the owner's decision. Unknown/blank statuses
 * are treated as non-editable (fail safe — never offer Approve on a mystery
 * status). */
export function postIsEditable(status: string): boolean {
  return (EDITABLE_STATUSES as readonly string[]).includes(status);
}

export interface PostActions {
  canApprove: boolean;
}

/** Which decision actions a post's status exposes — single source of truth so
 * `PostDetail` stays declarative.
 *
 * `canRequestChanges` was here until SPEC-178: "Request changes" set the post to
 * `changes_requested`, a two-person review handoff in a product with one person
 * who is both the reviewer and the fixer. Refine is what changes a draft. */
export function postActions(status: string): PostActions {
  return { canApprove: postIsEditable(status) };
}

/** Status tone tokens (Rule 9 — semantic tokens only; brand red is never used
 * for status). `tone` names a status color family the component maps to classes. */
export type StatusTone = "review" | "changes" | "success" | "neutral";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const STATUS_META: Record<string, StatusMeta> = {
  in_review: { label: "In review", tone: "review" },
  changes_requested: { label: "Changes requested", tone: "changes" },
  approved: { label: "Approved", tone: "success" },
  scheduled: { label: "Scheduled", tone: "success" },
  // SPEC-180's in-flight claim state — an in-flight post must read as in-flight,
  // not fall through titleCase to a bare "Publishing".
  publishing: { label: "Publishing…", tone: "review" },
  published: { label: "Published", tone: "success" },
};

/** Title-case a free-form token: "in_review" → "In review". */
function titleCase(value: string): string {
  const cleaned = value.replace(/_/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : cleaned;
}

/** Display label + tone for a post status, degrading unknown values to a neutral
 * title-cased chip rather than crashing. */
export function statusMeta(status: string): StatusMeta {
  return STATUS_META[status] ?? { label: titleCase(status) || "Draft", tone: "neutral" };
}

/**
 * Whether the server has an editorial image to show for this post: either the
 * hydrated `hasImage` flag, or a just-completed regenerate this session (a
 * `version` bump). Drives choosing `postImageUrl` over the product photo.
 */
export function hasServerImage(hasImage: boolean, version: number): boolean {
  return hasImage || version > 0;
}

/** The schedule situation a post is in, for the schedule-state line in
 * `PostDetail`. Pure (no date formatting — the component formats the raw date):
 * - `scheduled`: already has a live date.
 * - `planned`: still editable AND carries a `plannedFor` — approving auto-schedules.
 * - `approved-undated`: approved but no date yet (schedule it on the Calendar).
 * - `none`: nothing to say. */
export type ScheduleKind = "scheduled" | "planned" | "approved-undated" | "none";

export function scheduleKind(post: {
  status: string;
  scheduledFor: string | null;
  plannedFor: string | null;
}): ScheduleKind {
  if (post.scheduledFor) return "scheduled";
  if (postIsEditable(post.status) && post.plannedFor) return "planned";
  if (post.status === "approved") return "approved-undated";
  return "none";
}

/**
 * Map a Content Studio `ProductDraft` (+ its selected product) into a full
 * `PostDetail` so the workspace can render it through the shared view with no
 * extra round trip. Studio drafts are the editable surface, so the status
 * defaults to `in_review`; the caption is the first variant's body. Never
 * mutates its inputs.
 */
export function draftToPostDetail(
  draft: ProductDraft,
  product: StudioProduct,
): PostDetail {
  return {
    postId: draft.postId,
    channel: draft.channel,
    productId: Number(product.id),
    productName: product.name,
    imageUrl: product.imageUrl,
    creative: draft.creative,
    caption: draft.creative.captionVariants[0]?.body ?? "",
    hashtags: draft.creative.hashtags,
    hasImage: draft.hasImage,
    imageConcept: draft.imageConcept,
    status: "in_review",
    scheduledFor: null,
    plannedFor: null,
    // SPEC-168 — a locally-built draft has never been published; the real
    // publish state arrives with the next authoritative load.
    permalink: null,
    publishedAt: null,
    postedManually: false,
    externalPostId: null,
    publishError: null,
    scheduledAt: null,
    publishReady: false,
    reason: null,
    reasonDetail: null,
  };
}

/* ── Refine loop (SPEC-144) ───────────────────────────────────────────── */

/** Client guard mirroring the backend's `422 social_refine_instruction_invalid`
 * so an over-long instruction is caught before the round trip. */
export const REFINE_INSTRUCTION_MAX_LENGTH = 2000;

/** The suggestion chips offered in the Refine dialog — each pre-fills the
 * textarea (they never submit on their own). */
export const REFINE_SUGGESTIONS = [
  "Make it punchier",
  "Shorter",
  "Lean into the occasion",
  "Less salesy",
] as const;

/** Validate a refine instruction. Returns `null` when it's usable, or a
 * human-readable message when it's empty/whitespace-only or too long — the single
 * definition behind both the Refine button's disabled state and the submit guard. */
export function refineInstructionError(instruction: string): string | null {
  const trimmed = instruction.trim();
  if (!trimmed) return "Tell the writer what you'd like to change.";
  if (trimmed.length > REFINE_INSTRUCTION_MAX_LENGTH) {
    return `Keep it under ${REFINE_INSTRUCTION_MAX_LENGTH} characters.`;
  }
  return null;
}

/** The subset of `PostDetailView` state seeded from a post — used both at mount
 * and after a successful refine so the two paths seed identically. Pure. */
export interface RefinedPostSeed {
  creative: ProductCreative;
  /** The active caption variant to select (first, or null when none). */
  variantId: string | null;
  /** First variant's body, else the post's `caption` (matches mount seeding). */
  caption: string;
  status: string;
  hasImage: boolean;
  imageConcept: string | null;
  scheduledFor: string | null;
}

/** Derive the view-model seed for a (freshly refined) `PostDetail`. Never mutates
 * its input. */
export function refinedPostSeed(post: PostDetail): RefinedPostSeed {
  const first = post.creative.captionVariants[0] ?? null;
  return {
    creative: post.creative,
    variantId: first?.id ?? null,
    caption: first?.body ?? post.caption,
    status: post.status,
    hasImage: post.hasImage,
    imageConcept: post.imageConcept,
    scheduledFor: post.scheduledFor,
  };
}

/** The lightweight shape a `PostCard` renders — a subset of a post, so the
 * Approvals featured item + queue rows can each render one. */
export interface PostCardItem {
  postId: string;
  productName: string;
  channel: string;
  imageUrl: string | null;
  hasImage: boolean;
  status: string;
  /** Optional secondary line (e.g. "Submitted Aug 12 · Sarah"). */
  subtitle?: string;
}

/**
 * Map an Approvals `PendingPost` into a `PostCardItem` (SPEC-138). Everything in
 * the Approvals queue is awaiting the owner's decision, so the status is
 * `in_review`. `submittedLabel` is a pre-formatted date the caller supplies (the
 * component owns locale formatting) — folded into the subtitle with the persona.
 */
export function pendingPostToCardItem(
  post: PendingPost,
  submittedLabel: string,
): PostCardItem {
  const parts = [submittedLabel ? `Submitted ${submittedLabel}` : "", post.persona]
    .filter(Boolean)
    .join(" · ");
  return {
    postId: post.id,
    productName: post.productName,
    channel: post.channel,
    imageUrl: post.imageUrl,
    hasImage: post.hasImage,
    status: "in_review",
    subtitle: parts || undefined,
  };
}

/**
 * Map a `POST /social/weekly-plan/slots/{id}/generate` result into a full
 * `PostDetail` so a freshly generated slot auto-opens its detail with no extra
 * round trip (SPEC-138 fix 2). The planned draft carries its `plannedFor`; the
 * slot supplies the product identity + photo. Never mutates its inputs.
 */
export function plannedDraftToPostDetail(
  result: SlotGenerateResult,
  slot: PlanSlot,
): PostDetail {
  const { post } = result;
  return {
    postId: post.postId,
    channel: post.channel,
    productId: slot.productId,
    productName: slot.productName,
    imageUrl: slot.imageUrl,
    creative: post.creative,
    caption: post.creative.captionVariants[0]?.body ?? "",
    hashtags: post.creative.hashtags,
    hasImage: post.hasImage,
    imageConcept: null,
    status: result.slot.postStatus ?? "in_review",
    scheduledFor: null,
    plannedFor: post.plannedFor,
    // SPEC-168 — a locally-built draft has never been published; the real
    // publish state arrives with the next authoritative load.
    permalink: null,
    publishedAt: null,
    postedManually: false,
    externalPostId: null,
    publishError: null,
    scheduledAt: null,
    publishReady: false,
    reason: null,
    reasonDetail: null,
  };
}

import { canMarkPosted } from "@/lib/social-manual";

/**
 * Backend image-generation reason codes → what the owner reads. Lives here rather
 * than inside a component because two surfaces show it now — the post detail and
 * the Studio's shared-image action (SPEC-186) — and two copies would drift.
 */
export const IMAGE_REASONS: Record<string, string> = {
  no_openai_key:
    "Add an OpenAI key on the Integrations → AI Model card to generate images.",
  no_product_photo: "This product has no photo to build a scene from.",
  generation_failed: "Image generation failed — try again.",
  not_found: "Draft not found — regenerate the caption first.",
  // SPEC-327: limits, not failures — retrying won't help.
  media_limit_reached: "This month's images on your package are used. More are available next month.",
  ai_allowance_exhausted: "Your plan's AI allowance for this month is used. Add your own AI key on Integrations to keep going.",
};

/** What the owner reads when an image wasn't made: the backend's own sentence when it sent one
 * (a package limit or the AI allowance names itself), else the reason's text (SPEC-327). */
export function imageFailure(result: { reason?: string; detail?: string }): string {
  if (result.detail && (result.reason === "media_limit_reached" || result.reason === "ai_allowance_exhausted")) {
    return result.detail;
  }
  return IMAGE_REASONS[result.reason ?? ""] ?? "Couldn't generate the image.";
}

/* ── SPEC-173 — post-detail action + messaging rules ─────────────────────── */

/** Which single primary action the panel offers. Exactly one at a time, so the
 * owner is never asked to work out what to do next. */
export type PrimaryAction = "approve" | "mark-posted" | "none";

export function primaryAction(status: string): PrimaryAction {
  if (status === "in_review" || status === "changes_requested") return "approve";
  // Delegates rather than restating the rule: `canMarkPosted` already mirrors the
  // backend's mark-posted guard (SPEC-175) and is tested against it. Two copies of
  // one rule is exactly how a UI drifts from its API.
  if (canMarkPosted(status)) return "mark-posted";
  return "none"; // published, publishing — the status chip speaks for itself
}

export interface ScheduleMessage {
  text: string;
  /** True when the planned date has already passed — the UI shows the Calendar
   * link and a warning tone rather than a promise it cannot keep. */
  stale: boolean;
}

/**
 * The planned-draft sentence. Observed on 2026-08-28 promising
 * "auto-schedules for Aug 26, 2026" — a date two days gone. A message that
 * commits the system to something impossible is worse than no message.
 *
 * `plannedFor` and `today` are bare "YYYY-MM-DD" days, compared as strings so no
 * timezone can shift the answer by one day.
 */
export function scheduleMessage(
  plannedFor: string | null,
  today: string,
): ScheduleMessage | null {
  if (!plannedFor) return null;
  if (plannedFor < today) {
    return {
      text: "That planned date has passed — approve it and pick a new date on the Calendar.",
      stale: true,
    };
  }
  return { text: "Approving schedules it for", stale: false };
}

/** The commerce signals the planner works from, in the owner's words. */
const REASON_LABELS: Record<string, string> = {
  best_seller: "Best seller",
  new_drop: "New drop",
  new_arrival: "New arrival",
  dead_stock: "Aging stock",
  trending: "Trending",
  high_margin: "High margin",
};

/**
 * "Why this product" as one grounded line — the answer the page currently never
 * gives (Microsoft HAX G11). Returns null rather than an empty label when the
 * row carries no signal; an unknown token degrades to title case instead of
 * being dropped, so a new signal is never silently invisible.
 */
export function reasonLine(
  reason: string | null,
  reasonDetail: string | null,
): string | null {
  const label = reason ? (REASON_LABELS[reason] ?? titleCase(reason)) : null;
  const detail = reasonDetail?.trim() || null;
  if (label && detail) return `${label} · ${detail}`;
  return label ?? detail;
}
