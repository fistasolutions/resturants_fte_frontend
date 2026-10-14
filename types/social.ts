/**
 * Social Growth (Organic Social Media Manager) — the future API contract
 * (SPEC-110). The MVP ships frontend-only on mock data; these interfaces are
 * what the backend catalog / creative-generation / platform-insights services
 * will return, so components bind to them now and the data source swaps in a
 * later phase. `store_id`-scoped by construction, like the rest of the platform.
 *
 * Sibling to Spotlight (SPEC-109) — same shell + mock discipline, for organic
 * social instead of SEO.
 */

/** The channels Social Growth publishes to. Identity is conveyed by name + a
 * lucide icon only — never a platform brand color (root Rule 9). */
export type SocialChannel = "instagram" | "tiktok" | "facebook" | "pinterest";

/** The three creative aspect ratios a single product image is templated into. */
export type CreativeFormat = "feed" | "story" | "square";

/** For metrics where a *lower* number is better the tile flips delta colors. */
export type DeltaKind = "up-good" | "down-good";

export interface SocialKpi {
  id: string;
  label: string;
  /** Pre-formatted for display — the backend owns the calculation (Rule 8). */
  value: string;
  /** Signed percent change vs the prior period; omitted when there's no baseline. */
  delta?: number;
  deltaKind?: DeltaKind;
  hint?: string;
}

/* ── Overview ─────────────────────────────────────────────────────────── */

export type PipelineStatus = "complete" | "in_progress" | "not_started";

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  /** 0–100, already computed by the backend — the UI only renders the bar. */
  progress: number;
  status: PipelineStatus;
}

export type ActivityKind =
  | "plan"
  | "create"
  | "approval"
  | "publish"
  | "measure";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  timestamp: string;
}

/** The data-picked "what to post next" suggestion on Overview. */
export interface NextPost {
  productName: string;
  reason: ReasonKind;
  reasonDetail: string;
  channel: SocialChannel;
  persona: string;
  /** In-app deep link (e.g. the Content Studio tab). */
  href: string;
}

export interface OverviewData {
  pipeline: PipelineStage[];
  kpis: SocialKpi[];
  nextPost: NextPost;
  activity: ActivityItem[];
}

/* ── Content Studio ───────────────────────────────────────────────────── */

/** Why the FTE surfaced a product — each grounded in Shopify data. */
export type ReasonKind = "best_seller" | "new_drop" | "dead_stock";

export interface CreativeFrame {
  format: CreativeFormat;
  /** Short on-image headline overlaid on the placeholder tile. */
  headline: string;
}

export interface CaptionVariant {
  id: string;
  /** A short label for the angle, e.g. "Confident" / "Playful". */
  angle: string;
  body: string;
}

export interface ProductCreative {
  persona: string;
  /** The POV / content pillar this creative ladders up to. */
  pillar: string;
  frames: CreativeFrame[];
  captionVariants: CaptionVariant[];
  hashtags: string[];
}

export interface SocialProduct {
  id: string;
  name: string;
  category: string;
  /** Pre-formatted price for display (backend owns the value). */
  priceLabel: string;
  /** The product's real Shopify photo, or null. */
  imageUrl: string | null;
  reason: ReasonKind;
  reasonDetail: string;
  /** True for the single product the FTE actively recommends featuring next. */
  suggested: boolean;
  creative: ProductCreative;
  /** The persisted draft's id once content has been generated (else null). */
  postId: string | null;
  /** Whether an editorial image has been generated for that draft. */
  hasImage: boolean;
  /** The art director's scene concept for the current image, or null (SPEC-130). */
  imageConcept: string | null;
}

export interface ContentStudioData {
  products: SocialProduct[];
}

/* ── Content Studio: commerce-signal catalog (SPEC-134) ─────────────────── */

/** The commerce signals the catalog is sliced by (`GET /social/products`
 * `?category=`). `recommended` is the default the FTE surfaces; `all` is the
 * full catalog (the only category that accepts free-text `search`). */
export type SocialCategory =
  | "recommended"
  | "all"
  | "best_seller"
  | "new_arrival"
  | "dead_stock"
  | "trending"
  | "high_margin";

/** A lightweight catalog row from `GET /social/products` — the product-selection
 * surface only. Unlike `SocialProduct` it carries no embedded `creative`; the
 * generated drafts (with creative) arrive per-product from the drafts endpoint. */
export interface StudioProduct {
  id: string;
  name: string;
  category: string;
  /** Pre-formatted price for display (backend owns the value). */
  priceLabel: string;
  /** The product's real Shopify photo, or null. */
  imageUrl: string | null;
  /** Free-form reason token (coerced for display by `ReasonChip`). */
  reason: string;
  /** The grounded, human-readable reason detail, or null. */
  reasonDetail: string | null;
  /** True for the single product the FTE actively recommends featuring next. */
  suggested: boolean;
}

/** `GET /social/products` response — one page of the catalog for a signal.
 * `total` is the true full count (drives pagination); `limit`/`offset` echo the
 * requested window (SPEC-135). */
export interface StudioProductsPage {
  products: StudioProduct[];
  total: number;
  limit: number;
  offset: number;
}

/** A hydrated draft from `GET /social/products/{id}/drafts` — SPEC-133's
 * `GeneratedPost` plus the persisted editorial-image state so the workspace can
 * show an already-generated image immediately on selection (SPEC-134). */
export interface ProductDraft extends GeneratedPost {
  hasImage: boolean;
  imageConcept: string | null;
}

/** `GET /social/products/{id}/drafts` response — latest draft per channel. */
export interface ProductDraftsResult {
  posts: ProductDraft[];
}

/** One persisted `in_review` draft returned by `POST /social/generate` — one
 * per requested channel (SPEC-133). `channel` is a free-form string like the
 * rest of the platform, coerced for display (`ChannelBadge` degrades any value
 * outside `SocialChannel`). */
export interface GeneratedPost {
  postId: string;
  channel: string;
  creative: ProductCreative;
  /** Whether a generated editorial image is attached — the overwrite path
   * (SPEC-136) preserves an existing image across a caption regenerate, so the
   * UI must reflect it right away instead of assuming a fresh draft has none. */
  hasImage: boolean;
}

/** The `POST /social/generate` response: one draft per requested channel. */
export interface GenerateResult {
  posts: GeneratedPost[];
}

/* ── Weekly Plan board (SPEC-137) ─────────────────────────────────────── */

/** One planned slot in the AI's weekly content plan — the day/channel/product it
 * chose, the campaign it belongs to, and the grounded "why this product". Camel-
 * case, matching the backend contract exactly. `channel` is a free-form string
 * (coerced for display by `ChannelBadge`) like the rest of the platform; `postId`
 * is `null` until a draft has been generated for the slot. */
export interface PlanSlot {
  slotId: number;
  productId: number;
  productName: string;
  /** The product's real Shopify photo, or null. */
  imageUrl: string | null;
  /** "instagram" | "facebook" in practice; kept string-tolerant for display. */
  channel: string;
  /** Bare calendar day "YYYY-MM-DD" the AI planned this post for. */
  scheduledDate: string;
  /** The occasion/theme the day ladders up to (e.g. "Chanukah"), or null. */
  occasion: string | null;
  /** The campaign this slot belongs to (e.g. "Chanukah Week"). */
  campaignName: string;
  /** Free-form reason token (coerced for display by `ReasonChip`), or null. */
  reason: string | null;
  /** The grounded, human-readable reason detail, or null. */
  reasonDetail: string | null;
  /** The AI's "why this product" narrative for the slot. */
  rationale: string;
  /** The persisted draft's id once generated (else null). */
  postId: number | null;
  /** The draft's workflow status once generated (e.g. "in_review"), or null. */
  postStatus: string | null;
}

/** `POST /social/weekly-plan/generate` and the hydrated `GET` payload — the AI's
 * plan for one week. `title` is the campaign framing (e.g. "Chanukah Week"). */
export interface WeeklyPlan {
  id: number;
  /** Bare calendar day "YYYY-MM-DD" the plan's week starts on. */
  weekStart: string;
  title: string;
  slots: PlanSlot[];
}

/** `GET /social/weekly-plan` response — the persisted plan, or null when none. */
export interface WeeklyPlanResult {
  plan: WeeklyPlan | null;
}

/** `GET /social/posts/{id}` — the canonical single-post payload the reusable
 * `PostDetail` view binds to (SPEC-138). Camel-case, matching the live contract
 * exactly. `channel`/`status` are free-form strings (coerced for display like the
 * rest of the platform). `plannedFor` is the date a planned draft auto-schedules to
 * on approval (Weekly Plan slots); `scheduledFor` is its live schedule once dated. */
export interface PostDetail {
  postId: string;
  channel: string;
  productId: number | null;
  productName: string;
  /** The product's real Shopify photo, or null. */
  imageUrl: string | null;
  creative: ProductCreative;
  caption: string;
  hashtags: string[];
  hasImage: boolean;
  /** The art director's scene concept for the current image, or null. */
  imageConcept: string | null;
  /** Workflow status, e.g. "in_review" | "changes_requested" | "approved" |
   * "scheduled" | "published". Free-form; coerced for display. */
  status: string;
  /** Bare calendar day "YYYY-MM-DD" once scheduled, else null. */
  scheduledFor: string | null;
  /** The date an as-yet-unapproved planned draft will auto-schedule to on approval
   * ("YYYY-MM-DD"), or null for a non-planned draft. */
  plannedFor: string | null;
  /** Public URL of the live post once published, else null (SPEC-175). Written by
   * both the hand-posted path and, later, the API publish path — so the "View post"
   * link never has to branch on which one got here. */
  permalink: string | null;
  /** ISO-8601 timestamp the post went live, else null (SPEC-175). */
  publishedAt: string | null;
  /** True when the owner posted it by hand rather than via the API (SPEC-175).
   * Gates the Un-mark action: an API-published post is genuinely live and the
   * backend refuses to revert it. */
  postedManually: boolean;
  /** The live Instagram media / Facebook post id once published (SPEC-180) — its
   * presence is what proves the post really went out. */
  externalPostId: string | null;
  /** The last publish failure, so a post that failed at 3am on the scheduler
   * explains itself when the owner next opens it (SPEC-180). */
  publishError: string | null;
  /** The exact publish moment when one was chosen (SPEC-181); null means the
   * publisher uses its default hour on `scheduledFor`. */
  scheduledAt: string | null;
  /** The commerce signal that made the planner pick this product — "best_seller",
   * "dead_stock", "high_margin"… — and its grounded detail ("1,805 sold in 90
   * days"). SPEC-173: the answer to "why am I posting this", which was on the row
   * all along and never reached the screen. */
  reason: string | null;
  reasonDetail: string | null;
  /** Whether publishing from the app is actually possible for this post's channel
   * — Meta connected, public URL set, and (for Instagram) an IG account linked
   * (SPEC-184). False in manual-first mode, which is where the store is today, so
   * no Publish button is rendered at all. */
  publishReady: boolean;
}

/** One row of the Weekly Plan history (`GET /social/weekly-plans`, newest first). */
export interface WeeklyPlanSummary {
  id: number;
  /** Bare calendar day "YYYY-MM-DD" the plan's week starts on. */
  weekStart: string;
  title: string;
  /** How many slots the plan has, and how many already have a generated draft. */
  slotCount: number;
  generatedCount: number;
  /** How many slots ACTUALLY went out (backend SPEC-185). Distinct from
   * `generatedCount`: a draft nobody posted is not progress. */
  postedCount: number;
  /** The id of a newer plan covering the same week, else null (SPEC-185). */
  supersededBy: number | null;
  /** The STORED status. Do not display it — it only ever moves `planned → active`
   * and nothing writes to it again, so it cannot express a finished week. Use
   * `planStatus()` from `lib/weekly-plan-status`. */
  status: string;
  /** ISO-8601 instant the plan was created. */
  createdAt: string;
}

/** `GET /social/posts/{id}/video/status` — the Reel job (backend SPEC-187).
 * `none` before anything started; Veo takes 1-3 minutes so the UI polls. */
export interface VideoStatus {
  status: "none" | "generating" | "ready" | "failed";
  error?: string | null;
  durationSeconds?: number | null;
  /** Which kind of video this row is (backend SPEC-189). Absent on rows that
   * predate the field, which are all b-roll. */
  mode?: VideoMode;
  /** The job's real current step — "Filming the second half — 2 of 2…" (backend
   * SPEC-192). What the progress toast reads. Absent on older rows. */
  stage?: string | null;
  /** The written piece, present only for `ugc` — so the owner can read the
   * script and the persona instead of judging a finished video blind. */
  brief?: UgcBrief;
}

/** `broll` animates the post's still; `ugc` generates a written persona
 * speaking to camera, with the real product pinned in as a reference image. */
export type VideoMode = "broll" | "ugc";

/** The UGC director's output (backend SPEC-189). */
export interface UgcBrief {
  concept: string;
  persona: {
    name: string;
    who: string;
    look: string;
    wardrobe: string;
    setting: string;
    delivery: string;
  };
  hook: string;
  /** The words she actually speaks — this is what Veo voices. */
  script: string;
  /** The second spoken half, over clip two (backend SPEC-192). */
  scriptContinued?: string;
  visual: string;
  sound: string;
  onScreenText?: string | null;
  on_screen_text?: string | null;
}

/** `GET /social/weekly-plans` response — the plan history, newest first. */
export interface WeeklyPlansResult {
  plans: WeeklyPlanSummary[];
}

/** `GET /social/weekly-plans/{id}` response — the full plan for a history row. */
export interface WeeklyPlanByIdResult {
  plan: WeeklyPlan;
}

/** The draft returned by `POST /social/weekly-plan/slots/{id}/generate` — the
 * `in_review` post created for a slot, pre-assigned its planned schedule. */
export interface PlannedPostDraft {
  postId: string;
  channel: string;
  creative: ProductCreative;
  hasImage: boolean;
  /** The date the draft is scheduled to publish "YYYY-MM-DD" on approval. */
  plannedFor: string;
}

/** `POST /social/weekly-plan/slots/{id}/generate` response — the fresh draft plus
 * the updated slot (now carrying its `postId`/`postStatus`). */
export interface SlotGenerateResult {
  post: PlannedPostDraft;
  slot: PlanSlot;
}

/* ── Calendar (live — backend SPEC-123 + SPEC-131) ────────────────────── */

/** The two schedule states a post can be in on the calendar: `scheduled` (has a
 * date) or `approved` (approved but not yet dated — the "ready to schedule"
 * rail). The backend never sends drafts/in-review/published here. */
export type CalendarPostStatus = "approved" | "scheduled";

export interface CalendarPost {
  id: string;
  productName: string;
  /** Backend sends a free-form channel string; the UI coerces it for display
   * (`ChannelBadge` degrades gracefully for anything outside `SocialChannel`). */
  channel: string;
  status: CalendarPostStatus;
  persona: string;
  pillar: string;
  /** The product's real Shopify / editorial image URL, or null. */
  imageUrl: string | null;
  /** Bare calendar day "YYYY-MM-DD" when scheduled; null on the ready rail. */
  scheduledFor: string | null;
  /** UTM-tagged product URL for manual posting today, or null. */
  trackedLink: string | null;
}

export interface CalendarData {
  /** Approved + scheduled posts only, in one list (bucketed client-side). */
  posts: CalendarPost[];
}

/* ── Approvals ────────────────────────────────────────────────────────── */

export interface PendingPost {
  id: string;
  productName: string;
  channel: SocialChannel;
  format: CreativeFormat;
  persona: string;
  pillar: string;
  caption: string;
  hashtags: string[];
  estimatedReach: number;
  submittedAt: string;
  /** The product's real Shopify / editorial image URL, or null (SPEC-138). */
  imageUrl: string | null;
  /** Whether a generated editorial image is attached (SPEC-138). */
  hasImage: boolean;
}

export interface ApprovalsData {
  /** null when nothing is awaiting approval. */
  featured: PendingPost | null;
  queue: PendingPost[];
}

/* ── Performance (live — backend SPEC-131) ────────────────────────────── */

/** The content-pipeline funnel, backend-counted (Rule 8). Each stage is a
 * count of posts that reached it, monotonically non-increasing left→right. */
export interface SocialFunnel {
  generated: number;
  inReview: number;
  approved: number;
  scheduled: number;
  published: number;
}

export interface ChannelCount {
  /** Free-form channel string (coerced for display). */
  channel: string;
  count: number;
}

export interface ContentMixCount {
  /** Why the post was generated: best_seller | new_drop | dead_stock. */
  reason: string;
  count: number;
}

export interface AttributedPost {
  id: string;
  productName: string;
  channel: string;
  attributedOrders: number;
  attributedRevenue: number;
}

export interface SocialAttribution {
  /** The attribution lookback in days (e.g. 90). */
  windowDays: number;
  attributedOrders: number;
  attributedRevenue: number;
  /** Empty until tracked links start converting — drives an honest zero state. */
  topPosts: AttributedPost[];
}

/** One measured post in the engagement table (backend SPEC-182). */
export interface EngagementPost {
  id: string;
  productName: string;
  channel: string;
  /** The live post, when Meta returned one. */
  permalink: string | null;
  reach: number | null;
  likes: number | null;
  saves: number | null;
}

/** Real engagement recorded from Meta (backend SPEC-182).
 *
 * Every metric is `number | null` and that nullability is load-bearing: the
 * backend stores NULL when Meta did not report a metric, because "we don't know"
 * and "it got none" are different facts. Typing these as `number` would erase
 * that the moment someone wrote `?? 0`. */
export interface SocialEngagement {
  measuredPosts: number;
  totals: {
    reach: number | null;
    impressions: number | null;
    likes: number | null;
    comments: number | null;
    saves: number | null;
    shares: number | null;
  };
  topPosts: EngagementPost[];
}

export interface PerformanceData {
  funnel: SocialFunnel;
  byChannel: ChannelCount[];
  contentMix: ContentMixCount[];
  attribution: SocialAttribution;
  engagement: SocialEngagement;
  /** Whether Meta is actually connected (backend SPEC-182 — this was hard-coded
   * false until publishing and measurement existed). */
  platformConnected: boolean;
}

/** One carousel slide (backend SPEC-194). Slides are NOT versions: every one is
 * live, in `position` order, and the whole set publishes as a single post. */
export interface CarouselSlide {
  id: number;
  position: number;
  /** What this slide is FOR — "the hook", "how it fits", "the fabric". The
   * argument, readable next to the picture. */
  job?: string | null;
}

/** The carousel job for a post (backend SPEC-194). `none` before anything
 * started; slides render as they land, so a half-built carousel still shows. */
export interface CarouselStatus {
  status: "none" | "generating" | "ready" | "failed";
  error?: string | null;
  /** What the sequence argues, from the director. */
  concept?: string | null;
  /** The job's real current step — "Slide 2 of 3…" — for the progress toast. */
  stage?: string | null;
  slides: CarouselSlide[];
}
