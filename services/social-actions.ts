/**
 * Social Growth client mutations (SPEC-123) — through the proxy, like Spotlight's
 * action seam. Kept separate from services/social.ts (which imports the
 * server-only serverApi) so it's safe in the client bundle.
 */
import { buildProductsQuery } from "@/lib/social-catalog";
import { addSlotRequestBody, type AddSlotChannel } from "@/lib/social-plan";
import type {
  CalendarPost,
  CarouselStatus,
  GenerateResult,
  PlanSlot,
  PostDetail,
  ProductCreative,
  ProductDraftsResult,
  SlotGenerateResult,
  SocialCategory,
  StudioProductsPage,
  VideoMode,
  VideoStatus,
  WeeklyPlan,
  WeeklyPlanByIdResult,
  WeeklyPlanResult,
  WeeklyPlansResult,
} from "@/types/social";

const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

/** A literal union, not `string`: with both parameters typed `string` the
 * arguments could be swapped and still compile — which silently sent a request
 * to `/api/proxyGET` and made a feature look broken with no error anywhere. */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function send<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return send<T>("POST", path, body);
}

/** Fetch one page of the catalog for a commerce-signal category (SPEC-134,
 * paginated in SPEC-135). `search` is honoured only for the `all` category
 * (backend rule, enforced in `buildProductsQuery`); `limit` defaults to the
 * backend's 12 when omitted; `offset` pages through the full `total`. */
export function fetchSocialProducts(
  category: SocialCategory,
  search?: string,
  limit?: number,
  offset?: number,
): Promise<StudioProductsPage> {
  return send<StudioProductsPage>(
    "GET",
    `/social/products${buildProductsQuery(category, search, limit, offset)}`,
  );
}

/** Fetch the latest persisted draft per channel for a product (SPEC-134) — used
 * to hydrate the workspace on selection so generated drafts survive switching
 * products. Empty `posts` means nothing has been generated yet. */
export function fetchProductDrafts(
  productId: string,
): Promise<ProductDraftsResult> {
  return send<ProductDraftsResult>(
    "GET",
    `/social/products/${productId}/drafts`,
  );
}

/** Generate brand-voice creative for a product, one persisted `in_review` draft
 * per requested channel — the "Create" step (SPEC-133). `channels` is a subset
 * of ["instagram","facebook"]; the backend defaults to both if omitted. */
export function generateSocialPost(
  productId: string,
  channels: string[],
): Promise<GenerateResult> {
  return post<GenerateResult>("/social/generate", {
    productId: Number(productId),
    channels,
  });
}

/** Persist an edited caption (and optional hashtags) for a draft — `PATCH
 * /social/posts/{id}` (SPEC-133). The backend's 422 `social_caption_invalid`,
 * 404 `social_post_not_found`, and 409 `social_post_not_editable` messages
 * surface through the shared error envelope. Returns the updated caption +
 * creative. */
export function updatePostCaption(
  postId: string,
  caption: string,
  hashtags?: string[],
): Promise<{
  postId: string;
  channel: string;
  caption: string;
  creative: ProductCreative;
}> {
  return send("PATCH", `/social/posts/${postId}`, hashtags ? { caption, hashtags } : { caption });
}

/** Generate the editorial image (gpt-image-1) for a post — the dedicated image
 * step. Slow (~15–30s); never throws server-side, returns {generated, reason?}. */
export function generatePostImage(
  postId: string,
): Promise<{ generated: boolean; reason?: string; detail?: string; concept?: string }> {
  return post(`/social/posts/${postId}/image`);
}

/** One art direction, one render, the SAME image on every listed post (backend
 * SPEC-186). Generating for both channels used to make two independent
 * art-director calls, so the same product in the same minute came back as two
 * unrelated shoots — and cost twice. Slow (~30s+, plus the critic's round). */
export function generateSharedImage(
  postIds: string[],
): Promise<{ generated: boolean; reason?: string; detail?: string; concept?: string; sharedWith?: number }> {
  return post("/social/images/shared", { postIds: postIds.map(Number) });
}

/** Served editorial image URL for a post (cache-busted). */
export function postImageUrl(postId: string, version = 0): string {
  return `${base}/social/posts/${postId}/image?v=${version}`;
}

/** The same image as a file attachment (SPEC-168) — the backend names it from the
 * post's product + channel so a downloads folder stays usable. Same-origin through
 * the proxy, so an `<a download>` carries the httpOnly bearer server-side and the
 * browser saves it directly (no blob, works on mobile). `version` reuses the
 * cache-bust above so a regenerate is never downloaded stale. */
export function downloadImageUrl(postId: string, version = 0): string {
  return `${base}/social/posts/${postId}/image?v=${version}&download=1`;
}

/** Replace a post's image with the owner's OWN photo (`PUT /social/posts/{id}/image`).
 * Multipart — the shared `send` helper hardcodes a JSON content type, and the browser
 * must set the multipart boundary itself, so this posts directly. */
export async function uploadPostImage(
  postId: string,
  file: File,
): Promise<{ uploaded: boolean; source: string }> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${base}/social/posts/${postId}/image`, {
    method: "PUT",
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "That image could not be uploaded.");
  }
  return data as { uploaded: boolean; source: string };
}

/** Publish an approved post to Instagram/Facebook now (backend SPEC-180).
 * Slow (~10s — Instagram's container poll); the backend's actionable errors
 * (BACKEND_PUBLIC_URL unset, Meta not connected, no Instagram linked) surface
 * through the shared error envelope. */
export function publishPost(postId: string): Promise<{
  id: string;
  status: string;
  externalPostId: string | null;
  permalink: string | null;
  postedManually: boolean;
}> {
  return post(`/social/posts/${postId}/publish`);
}

/** Start a ~15s Reel animated from the post's own still (backend SPEC-187).
 * Returns immediately — Veo takes 1-3 minutes, so the caller polls
 * `getVideoStatus`. 409 `social_video_no_image` when there is no still to
 * animate: the video IS the image in motion, and generating the garment from
 * text would not produce this store's garment. */
export function startVideo(
  postIds: string[],
  refinement?: string | null,
  // SPEC-178: the UI can only start a reel now, so the default follows. b-roll
  // remains a valid backend mode for stored rows; nothing here can request it.
  mode: VideoMode = "ugc",
): Promise<{ status: string; concept?: string }> {
  return post("/social/videos", {
    postIds: postIds.map(Number),
    refinement: refinement?.trim() || null,
    mode,
  });
}

/** Advance and read the Reel job. Polling a finished job costs no Veo call. */
export function getVideoStatus(postId: string): Promise<VideoStatus> {
  return send<VideoStatus>("GET", `/social/posts/${postId}/video/status`);
}

/** The finished MP4 (cache-busted), for the panel's preview and download. */
export function videoUrl(postId: string, version = 0): string {
  return `${base}/social/posts/${postId}/video?v=${version}`;
}

/** Record that the owner posted this by hand (SPEC-175). `permalink` is optional. */
export function markPostPosted(
  postId: string,
  permalink: string | null,
): Promise<{
  id: string;
  status: string;
  publishedAt: string | null;
  permalink: string | null;
  postedManually: boolean;
}> {
  return post(`/social/posts/${postId}/mark-posted`, { permalink });
}

/** Undo a mis-click on the hand-posted path — reverts to scheduled/approved. */
export function unmarkPostPosted(
  postId: string,
): Promise<{ id: string; status: string }> {
  return post(`/social/posts/${postId}/unmark-posted`);
}

/** Load one post's canonical detail (`GET /social/posts/{id}`) — the payload the
 * reusable `PostDetail` view binds to when it isn't handed a pre-loaded object
 * (Approvals cards, already-generated plan slots). The backend's 404
 * `social_post_not_found` surfaces via the shared error envelope (SPEC-138). */
export function getPostDetail(id: string): Promise<PostDetail> {
  return send<PostDetail>("GET", `/social/posts/${id}`);
}

/** Ask the AI to rewrite a post from a natural-language instruction (SPEC-144) —
 * `POST /social/posts/{id}/refine` with `{ instruction }`. Returns the full,
 * refreshed `PostDetail` so the view can update in place. The backend's 404
 * `social_post_not_found`, 422 `social_refine_instruction_invalid`, and 409
 * (already published) messages surface via the shared error envelope. */
export function refinePost(
  postId: string,
  instruction: string,
): Promise<PostDetail> {
  return post<PostDetail>(`/social/posts/${postId}/refine`, { instruction });
}

/* ── Weekly Plan board (SPEC-137) ─────────────────────────────────────── */

/** Run the AI weekly planner — a ~10–30s call that lays out the whole week and
 * returns the persisted plan (`POST /social/weekly-plan/generate`). Callers show
 * the CSS building animation while it runs. */
export function generateWeeklyPlan(): Promise<WeeklyPlan> {
  return post<WeeklyPlan>("/social/weekly-plan/generate");
}

/** Load the persisted weekly plan (`GET /social/weekly-plan`) — `{ plan: null }`
 * when nothing has been generated yet. Used to hydrate the board on mount so a
 * plan survives a page refresh. */
export function fetchWeeklyPlan(): Promise<WeeklyPlanResult> {
  return send<WeeklyPlanResult>("GET", "/social/weekly-plan");
}

/** Load the Weekly Plan history (`GET /social/weekly-plans`, newest first) — the
 * rows the history list renders (SPEC-138). */
export function fetchWeeklyPlans(): Promise<WeeklyPlansResult> {
  return send<WeeklyPlansResult>("GET", "/social/weekly-plans");
}

/** Load one historical plan's full board (`GET /social/weekly-plans/{id}`),
 * unwrapping `{ plan }` (SPEC-138). The backend's 404 `weekly_plan_not_found`
 * surfaces via the shared error envelope. */
export async function fetchWeeklyPlanById(id: number): Promise<WeeklyPlan> {
  const res = await send<WeeklyPlanByIdResult>(
    "GET",
    `/social/weekly-plans/${id}`,
  );
  return res.plan;
}

/** Generate the draft for one plan slot (`POST /social/weekly-plan/slots/{id}/
 * generate`). The draft is created `in_review` with its planned schedule pre-
 * assigned; approving it later auto-schedules it onto the Calendar (backend).
 * Returns the fresh draft plus the updated slot. */
export function generatePlanSlot(slotId: number): Promise<SlotGenerateResult> {
  return post<SlotGenerateResult>(
    `/social/weekly-plan/slots/${slotId}/generate`,
  );
}

/** Add a manual slot to a weekly-plan day (SPEC-142) — `POST /social/weekly-plans/
 * {planId}/slots`. Returns the new ungenerated `PlanSlot` (`postId` null) the
 * board drops into that day with the normal Generate button; generating +
 * approving it later auto-schedules it to `scheduledDate`. Rejects via the shared
 * error envelope so the picker dialog can surface the message. */
export function addPlanSlot(
  planId: number,
  productId: string | number,
  channel: AddSlotChannel,
  scheduledDate: string,
): Promise<PlanSlot> {
  return post<PlanSlot>(
    `/social/weekly-plans/${planId}/slots`,
    addSlotRequestBody(productId, channel, scheduledDate),
  );
}

export function approveSocialPost(postId: string): Promise<{ id: string; status: string }> {
  return post(`/social/posts/${postId}/approve`);
}

/** Schedule (a "YYYY-MM-DD" date) or unschedule (null) an approved post — the
 * "Publish" step's manual-scheduling bridge. Returns the updated calendar post
 * (status flips scheduled↔approved). The backend's 404 `social_post_not_found`,
 * 409 `social_post_not_schedulable`, and 422 messages surface via `post()`. */
export function schedulePost(
  postId: string,
  date: string | null,
): Promise<CalendarPost> {
  return post<CalendarPost>(`/social/posts/${postId}/schedule`, { date });
}

/** Permanently delete a social post (`DELETE /social/posts/{id}`) — the
 * Calendar's destructive CRUD action (SPEC-143). Returns `{ ok: true }`; the
 * backend's 404 `social_post_not_found` (foreign/missing id) surfaces via the
 * shared error envelope in `send()`. */
export function deletePost(postId: string): Promise<{ ok: boolean }> {
  return send<{ ok: boolean }>("DELETE", `/social/posts/${postId}`);
}

/** One entry in a post's image gallery (backend SPEC-188). `id` is null for the
 * product's own Shopify photo, which is offered as a link rather than copied
 * into our database. */
export interface GalleryImage {
  id: number | null;
  source: "generated" | "uploaded" | "original" | "product";
  createdAt: string | null;
  url: string;
  selected: boolean;
}

/** Every image ever made for this post, newest first, plus the product original.
 * Regenerating appends rather than overwriting, so nothing is ever lost. */
export function postImageGallery(
  postId: string,
): Promise<{ postId: number; images: GalleryImage[] }> {
  // `send` takes (method, path) in that order.
  return send("GET", `/social/posts/${postId}/images`);
}

/** Make an image already in the gallery live again — no generation, no cost. */
export function selectPostImage(
  postId: string,
  imageId: number,
): Promise<{ postId: number; selectedImageId: number }> {
  return send("PUT", `/social/posts/${postId}/image/selected`, { imageId });
}

/** Make the product's own Shopify photo the post image. Copies it into the
 * gallery once, so from then on it behaves like any other version. */
export function applyOriginalPhoto(
  postId: string,
): Promise<{ postId: number; selectedImageId: number; source: string }> {
  return send("POST", `/social/posts/${postId}/image/use-original`);
}

/** A specific gallery image through the proxy. `download` serves it as a file. */
export function galleryImageUrl(
  postId: string,
  imageId: number,
  options: { download?: boolean; width?: number } = {},
): string {
  // Content-addressed and served `immutable` (backend SPEC-190), so no
  // cache-bust belongs here: the bytes under an id never change, and adding a
  // version would defeat the caching that makes switching instant.
  const params = new URLSearchParams();
  if (options.download) params.set("download", "1");
  if (options.width) params.set("w", String(options.width));
  const suffix = params.size ? `?${params}` : "";
  return `${base}/social/posts/${postId}/images/${imageId}${suffix}`;
}

/** The width the picker renders its tiles at. Server-rendered rather than a
 * CSS-scaled full-size PNG — five tiles used to cost ~3 MB (SPEC-190). */
export const GALLERY_THUMBNAIL_WIDTH = 160;

/** Every version of a post inline, in ONE request (backend SPEC-191).
 *
 * A request costs ~1.2s of session overhead against the remote database before
 * it reads anything, so warming a strip one image at a time meant paying that
 * fixed cost per version. Affordable as a batch only because a derivative is
 * ~38 KB: the whole strip is ~150 KB. */
export function preloadGalleryImages(
  postId: string,
  width: number = PREVIEW_WIDTH,
): Promise<{ images: { id: number; dataUrl: string }[] }> {
  return send("GET", `/social/posts/${postId}/images/preload?w=${width}`);
}

/** Remove one version for good (backend SPEC-191). Deleting the selected one
 * re-selects the newest survivor server-side. */
export function deleteGalleryImage(
  postId: string,
  imageId: number,
): Promise<{
  postId: number;
  deletedImageId: number;
  selectedImageId: number | null;
  remaining: number;
}> {
  return send("DELETE", `/social/posts/${postId}/images/${imageId}`);
}

/** The width the preview renders at. Also the width prefetched for every
 * version, so a switch is a repaint (SPEC-176). */
export const PREVIEW_WIDTH = 1024;

/** Build a carousel from the post's approved image (backend SPEC-194). Returns
 * immediately — 3-5 slides is 1.5-2.5 minutes of rendering, so the client polls. */
export function startCarousel(
  postId: string,
  refinement?: string | null,
): Promise<{ status: string }> {
  return post("/social/carousels", {
    postId: Number(postId),
    refinement: refinement?.trim() || null,
  });
}

/** Advance and read the carousel job. Polling a finished one renders nothing new. */
export function getCarouselStatus(postId: string): Promise<CarouselStatus> {
  return send<CarouselStatus>("GET", `/social/posts/${postId}/carousel`);
}

/** Drop a slide. The backend closes the gap — positions are the publish order. */
export function deleteSlide(postId: string, slideId: number): Promise<CarouselStatus> {
  return send<CarouselStatus>(
    "DELETE",
    `/social/posts/${postId}/carousel/slides/${slideId}`,
  );
}

/** One slide's PNG, through the proxy like every other authenticated image. */
export function slideImageUrl(postId: string, slideId: number): string {
  return `/api/proxy/social/posts/${postId}/carousel/slides/${slideId}`;
}
