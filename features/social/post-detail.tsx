"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Bookmark, Camera, Check, CheckCircle2, Copy, Download, ExternalLink, Globe, Heart, ImagePlus, Loader2, MessageCircle, MoreHorizontal, PencilLine, Send, Share2, ShoppingBag, ThumbsUp, UserRound } from "lucide-react";

import {
  PREVIEW_WIDTH,
  deleteGalleryImage,
  galleryImageUrl,
  preloadGalleryImages,
  postImageGallery,
  selectPostImage,
  applyOriginalPhoto,
  type GalleryImage,
} from "@/services/social-actions";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import {
  captionCount,
  captionSaveBlocked,
  findVariant,
} from "@/lib/social-studio";
import {
  imageFailure,
  hasServerImage,
  postActions,
  primaryAction,
  reasonLine,
  refinedPostSeed,
  scheduleKind,
  scheduleMessage,
} from "@/lib/social-post";
import {
  canUnmarkPosted,
  normalizePermalink,
  publishedLabel,
  validateUploadFile,
} from "@/lib/social-manual";
import { canPublishNow, publishButtonLabel } from "@/lib/social-publish";
import {
  CAROUSEL_POLL_MS,
  shouldPollCarousel,
  showCarouselStrip,
} from "@/lib/social-carousel";
import {
  VIDEO_POLL_MS,
  shouldPollVideo,
  showMediaToast,
  showVideoTile,
} from "@/lib/social-media";
import { VideoTile } from "./video-tile";
import { VersionRail } from "./version-rail";
import { UgcBriefCard } from "./ugc-brief-card";
import {
  approveSocialPost,
  deleteSlide,
  downloadImageUrl,
  getCarouselStatus,
  startCarousel,
  generatePostImage,
  getPostDetail,
  getVideoStatus,
  markPostPosted,
  postImageUrl,
  publishPost,
  refinePost,
  startVideo,
  unmarkPostPosted,
  updatePostCaption,
  videoUrl,
  uploadPostImage,
} from "@/services/social-actions";
import type {
  CarouselSlide,
  PostDetail as PostDetailData,
  ProductCreative,
  UgcBrief,
  VideoMode,
} from "@/types/social";
import { formatDate, formatNumber } from "@/utils/format";

import { MarkPostedDialog } from "./mark-posted-dialog";
import { MediaDialog } from "./media-dialog";
import { MediaProgressToast } from "./media-progress-toast";
import { CarouselStrip } from "./carousel-strip";
import { CarouselViewer } from "./carousel-viewer";
import { PreviewImage } from "./preview-image";
import { RefinePostDialog } from "./refine-post-dialog";
import { PostStatusChip } from "./social-pills";
import { GlispIcon } from "@/components/shared/glisp-icon";

/** Native-preview chrome placeholders for the store's public identity (SPEC-007) — a neutral
 * stand-in, never the platform's name (SPEC-337). */
const BRAND_NAME = "Example Store";
const BRAND_HANDLE = "examplestore";
const BRAND_DOMAIN = "examplestore.com";

/* ── Read-only caption inside the native preview (left column) ───────────── */

function CaptionPreview({
  handlePrefix,
  caption,
}: {
  /** Bold handle prefix rendered before the caption (Instagram), else null. */
  handlePrefix: string | null;
  caption: string;
}) {
  return (
    <p className="text-sm whitespace-pre-wrap text-foreground">
      {handlePrefix && <span className="font-semibold">{handlePrefix} </span>}
      {caption}
    </p>
  );
}

/* ── Editable caption control (right column) ─────────────────────────────── */

function CaptionEditor({
  channel,
  label,
  editing,
  draft,
  saving,
  saved,
  error,
  onDraftChange,
  onStartEdit,
  onSave,
  onCancel,
}: {
  channel: string;
  label: string;
  editing: boolean;
  draft: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (editing) {
    const count = captionCount(channel, draft);
    return (
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          rows={6}
          aria-label={`Edit ${label} caption`}
          className="resize-y text-sm"
          autoFocus
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "tabular-nums",
                count.over ? "text-warning" : "text-muted-foreground",
              )}
            >
              {formatNumber(count.count)} / {formatNumber(count.limit)}
            </span>
            {count.over && (
              <span className="inline-flex items-center gap-1 text-warning">
                <AlertTriangle className="size-3" aria-hidden />
                Over {label}&apos;s limit — it may be truncated.
              </span>
            )}
          </span>
          <span className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving || captionSaveBlocked(draft)}
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </span>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <RoleGate need="social.manage">
        <Button variant="outline" size="sm" onClick={onStartEdit}>
          <PencilLine className="size-3.5" aria-hidden />
          Edit caption
        </Button>
      </RoleGate>
      {saved && (
        <span
          role="status"
          className="inline-flex items-center gap-1 text-xs font-medium text-success"
        >
          <CheckCircle2 className="size-3" aria-hidden />
          Saved
        </span>
      )}
    </div>
  );
}

/* ── Small right-panel section label ─────────────────────────────────────── */

function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

/* ── The resolved single-post view ───────────────────────────────────────── */

function PostDetailView({
  post,
  onBack,
  onChanged,
  compact = false,
}: {
  post: PostDetailData;
  onBack?: () => void;
  onChanged?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  // The role decides what this view may change (SPEC-358): editing the post and its
  // media is social.manage; approving, publishing and the posted record are social.publish.
  const can = useCan();
  const editGate = can("social.manage");
  const isInstagram = post.channel === "instagram";
  const label = isInstagram ? "Instagram" : "Facebook";

  const firstBody = post.creative.captionVariants[0]?.body ?? post.caption;
  const [creative, setCreative] = useState<ProductCreative>(post.creative);
  const [variantId, setVariantId] = useState<string | null>(
    post.creative.captionVariants[0]?.id ?? null,
  );
  const [caption, setCaption] = useState(firstBody);
  const [draft, setDraft] = useState(firstBody);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [hasImage, setHasImage] = useState(post.hasImage);
  const [imgVersion, setImgVersion] = useState(0);
  const [imgStatus, setImgStatus] = useState<"idle" | "generating" | "error">("idle");
  const [imgError, setImgError] = useState<string | null>(null);
  const [concept, setConcept] = useState<string | null>(post.imageConcept);

  // Decision (approve / request-changes) state — locally reflected so the view
  // updates immediately; the authoritative status comes back from the endpoint.
  const [status, setStatus] = useState(post.status);
  const [scheduledFor, setScheduledFor] = useState<string | null>(post.scheduledFor);
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Refine (AI rewrite from a prompt) state (SPEC-144).
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Manual actions (SPEC-168): copy caption, upload own photo, mark as posted.
  // SPEC-187 — the Media dialog: one place for everything that costs money.
  const [mediaOpen, setMediaOpen] = useState(false);
  const [refinement, setRefinement] = useState("");
  const [videoStatus, setVideoStatus] = useState("none");
  // SPEC-178: the backend's real step ("Filming the second half — 2 of 2…"),
  // which is what the progress toast reports instead of a bare spinner.
  const [videoStage, setVideoStage] = useState<string | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);
  // SPEC-179 — the carousel is a third artifact of this post, tracked like the
  // reel: its own status, its own stage for the toast, its own slides.
  const [carouselStatus, setCarouselStatus] = useState("none");
  const [carouselStage, setCarouselStage] = useState<string | null>(null);
  const [carouselError, setCarouselError] = useState<string | null>(null);
  const [carouselConcept, setCarouselConcept] = useState<string | null>(null);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [carouselBusy, setCarouselBusy] = useState(false);
  const [carouselToastDismissed, setCarouselToastDismissed] = useState(true);
  const [deletingSlide, setDeletingSlide] = useState<number | null>(null);
  // SPEC-180 — which slide the viewer is open on, or null when it is closed.
  const [viewingSlide, setViewingSlide] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoVersion, setVideoVersion] = useState(0);
  // SPEC-174 — what Veo actually returned, written on the tile.
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  // SPEC-189 — which kind of video, and the written piece behind a UGC one.
  // SPEC-178: no longer chosen — a reel IS a person talking. Kept as a constant
  // so the request contract with the backend is unchanged (b-roll still exists
  // there for stored videos, it just cannot be started from the UI any more).
  const videoMode: VideoMode = "ugc";
  const [videoBrief, setVideoBrief] = useState<UgcBrief | null>(null);

  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // SPEC-188 — every image ever made for this post. Regenerating appends, so an
  // image the owner liked can always be brought back without paying for a new
  // generation.
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  // SPEC-191 — pull EVERY version in one request and hold the bytes in the
  // page. Warming them one at a time still paid ~1.2s of per-request database
  // overhead per version, so a click landing inside that window waited. With
  // them inline, switching stops touching the network at all.
  const [inlineImages, setInlineImages] = useState<Record<number, string>>({});
  useEffect(() => {
    if (gallery.length === 0) return;
    let live = true;
    preloadGalleryImages(post.postId)
      .then((result) => {
        if (!live) return;
        setInlineImages(
          Object.fromEntries(result.images.map((i) => [i.id, i.dataUrl])),
        );
      })
      // A failed preload is a slower panel, never a broken one — the tiles and
      // the preview still have their own urls to fall back on.
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [gallery, post.postId]);

  // SPEC-190 — the id the owner just clicked, applied to the preview BEFORE the
  // server confirms. The switch used to wait on a round trip and then download
  // the whole image; the bytes are already in the browser from the tile, so the
  // only honest reason to wait was that we asked for a different URL.
  const [pendingImageId, setPendingImageId] = useState<number | null>(null);
  const [switching, setSwitching] = useState<number | null>(null);
  const loadGallery = useCallback(() => {
    // A gallery that fails to load must never block generating or uploading —
    // it is an extra way back, not a dependency of the image itself. But it is
    // reported: swallowing this silently is exactly how a broken request made
    // the strip look like a missing feature rather than a failing one.
    postImageGallery(post.postId)
      .then((result) => setGallery(result.images))
      .catch((error) => {
        console.error("Could not load the image gallery", error);
        setGallery([]);
      });
  }, [post.postId]);

  // Load the gallery once the post is known, so the picker is ready before the
  // owner reaches for it. Mirrors the load-on-mount pattern below: a liveness
  // flag rather than a bare await, so a remount cannot set state on a gone
  // component.
  useEffect(() => {
    let active = true;
    postImageGallery(post.postId)
      .then((result) => {
        if (active) setGallery(result.images);
      })
      .catch((error) => {
        console.error("Could not load the image gallery", error);
        if (active) setGallery([]);
      });
    return () => {
      active = false;
    };
  }, [post.postId]);

  // The product photo is not yet a post image — using it copies it in, then it
  // behaves like any other version. Without this the original was display-only,
  // so on a post whose one generated image was already live nothing in the
  // gallery was clickable at all.
  async function applyOriginal() {
    if (!editGate.allowed) return;
    setSwitching(-1);
    try {
      await applyOriginalPhoto(post.postId);
      setHasImage(true);
      setPendingImageId(null); // a new image supersedes the picked one
      setImgVersion((version) => version + 1);
      loadGallery();
      onChanged?.();
    } catch (error) {
      console.error("Could not use the original photo", error);
    } finally {
      setSwitching(null);
    }
  }

  async function removeGalleryImage(imageId: number) {
    if (!editGate.allowed) return;
    setSwitching(imageId);
    try {
      const result = await deleteGalleryImage(post.postId, imageId);
      // The server picked the survivor; mirror it rather than guessing.
      setPendingImageId(result.selectedImageId);
      setHasImage(result.remaining > 0);
      loadGallery();
      onChanged?.();
    } catch (error) {
      console.error("Could not delete that version", error);
    } finally {
      setSwitching(null);
    }
  }

  async function applyGalleryImage(imageId: number) {
    if (!editGate.allowed) return;
    const previous = pendingImageId;
    setPendingImageId(imageId); // repaint now, from bytes already cached
    setSwitching(imageId);
    try {
      await selectPostImage(post.postId, imageId);
      loadGallery();
      onChanged?.();
    } catch (error) {
      // The server refused, so the preview must not keep claiming otherwise.
      setPendingImageId(previous);
      console.error("Could not switch the image", error);
    } finally {
      setSwitching(null);
    }
  }
  const [markOpen, setMarkOpen] = useState(false);
  const [markLink, setMarkLink] = useState("");
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(post.publishError);
  const [publishedAt, setPublishedAt] = useState<string | null>(post.publishedAt);
  const [permalink, setPermalink] = useState<string | null>(post.permalink);
  const [postedManually, setPostedManually] = useState(post.postedManually);

  const activeVariant = findVariant(creative, variantId);
  const serverImage = hasServerImage(hasImage, imgVersion);
  // Prefer the CONTENT-ADDRESSED url (SPEC-190): it is the same address the
  // tile already fetched and it is served `immutable`, so switching back to a
  // version already seen is a repaint rather than a download. Falls back to the
  // "current image" url when the gallery has not loaded or a fresh generate has
  // not yet appeared in it.
  const selectedImageId =
    pendingImageId ?? gallery.find((image) => image.selected)?.id ?? null;
  const imageUrl = serverImage
    ? selectedImageId !== null
      ? // Inline bytes when the preload has them (SPEC-191) — no request at all.
        // Otherwise the display derivative: the originals are 2.2-2.4 MB and the
        // same picture is ~38 KB at this width. Downloads still get the PNG.
        (inlineImages[selectedImageId] ??
          galleryImageUrl(post.postId, selectedImageId, { width: PREVIEW_WIDTH }))
      : postImageUrl(post.postId, imgVersion)
    : post.imageUrl;

  const actions = postActions(status);
  const schedule = scheduleKind({ status, scheduledFor, plannedFor: post.plannedFor });
  // SPEC-173 — one primary action at a time, an honest planned-date sentence, and
  // the commerce reason that answers "why am I posting this".
  const primary = primaryAction(status);
  const plannedMessage = scheduleMessage(
    post.plannedFor,
    new Date().toISOString().slice(0, 10),
  );
  const why = reasonLine(post.reason, post.reasonDetail);

  function pickVariant(id: string) {
    const variant = findVariant(creative, id);
    setVariantId(id);
    setCaption(variant?.body ?? "");
    setDraft(variant?.body ?? "");
    setSaved(false);
  }

  function startEdit() {
    setDraft(caption);
    setEditing(true);
    setSaveError(null);
    setSaved(false);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(caption);
    setSaveError(null);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await updatePostCaption(post.postId, draft, creative.hashtags);
      setCreative(res.creative);
      setCaption(res.caption);
      setDraft(res.caption);
      setEditing(false);
      setSaved(true);
      onChanged?.();
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Couldn't save the caption. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function regenerateImage() {
    setImgStatus("generating");
    setImgError(null);
    try {
      const res = await generatePostImage(post.postId);
      if (res.generated) {
        setHasImage(true);
        setImgVersion((version) => version + 1);
        setConcept(res.concept ?? null);
        setImgStatus("idle");
        loadGallery();
        onChanged?.();
        router.refresh();
      } else {
        setImgError(imageFailure(res));
        setImgStatus("error");
      }
    } catch {
      setImgError("Couldn't generate the image — try again.");
      setImgStatus("error");
    }
  }

  /** Copy what actually gets pasted into Instagram: the ACTIVE caption variant
   * plus the hashtag line, not just one of them. */
  async function copyCaption() {
    const payload = hashtagLine ? `${caption}\n\n${hashtagLine}` : caption;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable in an insecure context or when denied — a
      // rejected promise must never break the panel (same guard as SPEC-132's
      // tracked-link copy).
      setUploadError("Couldn't copy — select the caption and copy it manually.");
    }
  }

  async function uploadImage(file: File) {
    const check = validateUploadFile(file);
    if (!check.ok) {
      setUploadError(check.message);
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await uploadPostImage(post.postId, file);
      setHasImage(true);
      setImgVersion((version) => version + 1);
      // An owner's own photo has no art-director brief behind it.
      setConcept(null);
      loadGallery();
      onChanged?.();
      router.refresh();
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Couldn't upload that image. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  /** Publish live via the API (SPEC-180). Slow — Instagram's container poll can
   * take ~10s, and a silent 10-second button is indistinguishable from a broken
   * one, hence the explicit pending state. */
  async function publishNow() {
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await publishPost(post.postId);
      setStatus(res.status);
      setPermalink(res.permalink);
      setPostedManually(false);
      setPublishedAt(new Date().toISOString());
      onChanged?.();
      router.refresh();
    } catch (error) {
      // The backend's actionable messages (BACKEND_PUBLIC_URL unset, Meta not
      // connected, no Instagram linked) are the whole value here — surface them
      // verbatim rather than a generic failure.
      setPublishError(
        error instanceof Error
          ? error.message
          : "Couldn't publish that. Please try again.",
      );
    } finally {
      setPublishing(false);
    }
  }

  async function confirmMarkPosted() {
    const link = normalizePermalink(markLink);
    if (!link.ok) {
      setMarkError(link.message);
      return;
    }
    setMarking(true);
    setMarkError(null);
    try {
      const res = await markPostPosted(post.postId, link.value);
      setStatus(res.status);
      setPublishedAt(res.publishedAt);
      setPermalink(res.permalink);
      setPostedManually(res.postedManually);
      setMarkOpen(false);
      setMarkLink("");
      onChanged?.();
      router.refresh();
    } catch (error) {
      setMarkError(
        error instanceof Error
          ? error.message
          : "Couldn't record that. Please try again.",
      );
    } finally {
      setMarking(false);
    }
  }

  async function undoMarkPosted() {
    setMarking(true);
    setMarkError(null);
    try {
      const res = await unmarkPostPosted(post.postId);
      setStatus(res.status);
      setPublishedAt(null);
      setPermalink(null);
      setPostedManually(false);
      onChanged?.();
      router.refresh();
    } catch (error) {
      setMarkError(
        error instanceof Error
          ? error.message
          : "Couldn't undo that. Please try again.",
      );
    } finally {
      setMarking(false);
    }
  }

  // Veo takes 1-3 minutes, so the job is start-and-poll. Silence for that long
  // would be indistinguishable from a hang.
  useEffect(() => {
    if (!shouldPollVideo(videoStatus)) return;
    let live = true;
    const timer = window.setInterval(async () => {
      try {
        const next = await getVideoStatus(post.postId);
        if (!live) return;
        setVideoStatus(next.status);
        setVideoStage(next.stage ?? null);
        setVideoError(next.error ?? null);
        setVideoDuration(next.durationSeconds ?? null);
        if (next.brief) setVideoBrief(next.brief);
        if (next.status === "ready") setVideoVersion((v) => v + 1);
      } catch {
        // A dropped poll is not a failed job — keep waiting.
      }
    }, VIDEO_POLL_MS);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [videoStatus, post.postId]);

  // Pick up a job already running when the panel mounts.
  useEffect(() => {
    let live = true;
    getVideoStatus(post.postId)
      .then((next) => {
        if (!live) return;
        setVideoStatus(next.status);
        setVideoStage(next.stage ?? null);
        setVideoError(next.error ?? null);
        setVideoDuration(next.durationSeconds ?? null);
        if (next.brief) setVideoBrief(next.brief);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [post.postId]);

  function applyCarousel(next: {
    status: string;
    stage?: string | null;
    error?: string | null;
    concept?: string | null;
    slides?: CarouselSlide[];
  }) {
    setCarouselStatus(next.status);
    setCarouselStage(next.stage ?? null);
    setCarouselError(next.error ?? null);
    setCarouselConcept(next.concept ?? null);
    setSlides(next.slides ?? []);
  }

  // Each slide is a ~30s render, so a carousel is 1.5-2.5 minutes — polled for
  // the same reason the reel is: silence that long is indistinguishable from a
  // hang. Slides render as they land rather than all at the end.
  useEffect(() => {
    if (!shouldPollCarousel(carouselStatus)) return;
    let live = true;
    const timer = window.setInterval(async () => {
      try {
        const next = await getCarouselStatus(post.postId);
        if (!live) return;
        applyCarousel(next);
      } catch {
        // A dropped poll is not a failed job — the next tick re-reads.
      }
    }, CAROUSEL_POLL_MS);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [carouselStatus, post.postId]);

  useEffect(() => {
    let live = true;
    getCarouselStatus(post.postId)
      .then((next) => {
        if (!live) return;
        applyCarousel(next);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [post.postId]);

  async function buildCarousel() {
    setCarouselBusy(true);
    setCarouselError(null);
    try {
      setCarouselToastDismissed(false);
      setCarouselStage("Planning the sequence…");
      await startCarousel(post.postId, refinement);
      setCarouselStatus("generating");
    } catch (error) {
      setCarouselError(
        error instanceof Error ? error.message : "Couldn't start the carousel.",
      );
      setCarouselStatus("failed");
    } finally {
      setCarouselBusy(false);
    }
  }

  async function removeSlide(slideId: number) {
    if (!editGate.allowed) {
      setCarouselError(editGate.reason);
      return;
    }
    setDeletingSlide(slideId);
    try {
      applyCarousel(await deleteSlide(post.postId, slideId));
    } catch (error) {
      setCarouselError(
        error instanceof Error ? error.message : "Couldn't delete that slide.",
      );
    } finally {
      setDeletingSlide(null);
    }
  }

  async function generateVideo() {
    setVideoBusy(true);
    setVideoError(null);
    try {
      setVideoBrief(null); // the previous script does not describe the new job
      setToastDismissed(false); // a new run always gets a visible toast
      setVideoStage("Writing the script…");
      await startVideo([post.postId], refinement, videoMode);
      setVideoStatus("generating");
    } catch (error) {
      setVideoError(
        error instanceof Error ? error.message : "Couldn't start the video.",
      );
      setVideoStatus("failed");
    } finally {
      setVideoBusy(false);
    }
  }

  function openRefine() {
    setRefineError(null);
    setRefineOpen(true);
  }

  async function refine() {
    setRefining(true);
    setRefineError(null);
    try {
      const res = await refinePost(post.postId, refineInstruction.trim());
      const seed = refinedPostSeed(res);
      setCreative(seed.creative);
      setVariantId(seed.variantId);
      setCaption(seed.caption);
      setDraft(seed.caption);
      setEditing(false);
      setSaveError(null);
      setSaved(false);
      setStatus(seed.status);
      setScheduledFor(seed.scheduledFor);
      setConcept(seed.imageConcept);
      setHasImage(seed.hasImage);
      // Bust the served-image cache only when the refined post actually has one,
      // so `hasServerImage` never claims an image that isn't there.
      if (seed.hasImage) setImgVersion((version) => version + 1);
      setRefineOpen(false);
      setRefineInstruction("");
      onChanged?.();
      router.refresh();
    } catch (error) {
      setRefineError(
        error instanceof Error
          ? error.message
          : "Couldn't refine the post. Please try again.",
      );
    } finally {
      setRefining(false);
    }
  }

  /**
   * Approve. "Request changes" lived here too until SPEC-178: it set the post to
   * `changes_requested`, a two-person review handoff in a product with one
   * person who is both reviewer and fixer. Refine is what actually changes a
   * draft.
   */
  async function decide() {
    setDecisionSaving(true);
    setDecisionError(null);
    try {
      const res = await approveSocialPost(post.postId);
      setStatus(res.status);
      // A planned draft auto-schedules on approval — reflect its date locally
      // until the next authoritative load.
      if (res.status === "scheduled" && post.plannedFor) {
        setScheduledFor(post.plannedFor);
      }
      onChanged?.();
      router.refresh();
    } catch (error) {
      setDecisionError(
        error instanceof Error
          ? error.message
          : "Couldn't save that. Please try again.",
      );
    } finally {
      setDecisionSaving(false);
    }
  }

  const captionPreview = (
    <CaptionPreview
      handlePrefix={isInstagram ? BRAND_HANDLE : null}
      caption={caption}
    />
  );

  const captionEditor = (
    <CaptionEditor
      channel={post.channel}
      label={label}
      editing={editing}
      draft={draft}
      saving={saving}
      saved={saved}
      error={saveError}
      onDraftChange={setDraft}
      onStartEdit={startEdit}
      onSave={save}
      onCancel={cancelEdit}
    />
  );

  const hashtagLine = creative.hashtags
    .map((tag) => `#${tag.replace(/^#/, "")}`)
    .join(" ");

  return (
    <div className="flex flex-col gap-4">
      {onBack && (
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Button>
      )}

      {/* SPEC-173 — the controls used on EVERY post, pinned where they can be
          reached without hunting, with the status chip beside them so state and
          action stop living in opposite corners of the screen. */}
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-1 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* SPEC-176 — two of these sit side by side in the Studio's "Both" view;
            without the channel name nothing says which Approve is which. */}
        <span className="inline-flex items-center gap-1.5 pr-1 text-sm font-semibold text-foreground">
          {isInstagram ? (
            <Camera className="size-4" aria-hidden />
          ) : (
            <ThumbsUp className="size-4" aria-hidden />
          )}
          {label}
        </span>
        <Button variant="outline" size="sm" onClick={copyCaption}>
          {copied ? (
            <>
              <Check className="size-3.5" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden />
              Copy caption
            </>
          )}
        </Button>

        {serverImage && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={downloadImageUrl(post.postId, imgVersion)}
              download
              aria-label="Download the image for this post"
            >
              <Download className="size-3.5" aria-hidden />
              Download
            </a>
          </Button>
        )}

        <span className="flex-1" />
        <PostStatusChip status={status} />

        {primary === "approve" && (
          <RoleButton
            need="social.publish"
            size="sm"
            onClick={() => decide()}
            disabled={decisionSaving}
          >
            {decisionSaving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden />
            )}
            Approve
          </RoleButton>
        )}
        {primary === "mark-posted" && (
          <RoleButton
            need="social.publish"
            size="sm"
            onClick={() => {
              setMarkError(null);
              setMarkOpen(true);
            }}
          >
            <PencilLine className="size-3.5" aria-hidden />
            I posted it
          </RoleButton>
        )}
        {permalink && (
          <Button variant="outline" size="sm" asChild>
            <a href={permalink} target="_blank" rel="noopener noreferrer">
              View post
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Button>
        )}
      </div>

      {/* Two columns on wide screens: the native preview left, details/actions
          right so the space is used; stacks to one column below `lg`.

          `compact` MUST stack. It is used when several drafts sit side by side,
          where each column is far narrower than the 24rem preview + a readable
          details column needs — forcing the two-column grid there squeezed the
          right rail to ~40px and wrapped every label mid-word
          ("The Full- Wardrobe Shopper"). */}
      <div
        className={cn(
          "grid gap-6 lg:items-start",
          !compact && "lg:grid-cols-[24rem_minmax(0,1fr)]",
        )}
      >
        {/* LEFT — native post preview, with the version rail beside it.
            SPEC-176: the rail used to sit under the controls, below the fold,
            while the space to the preview's right stayed empty — so comparing a
            version against the post it would appear in meant scrolling between
            the two. */}
        <div className="flex w-full items-start gap-3">
        <article className="w-full min-w-0 max-w-md overflow-hidden rounded-card border border-border bg-card">
          {isInstagram ? (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground">
                  <Camera className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {BRAND_HANDLE}
                  </p>
                  <p className="text-[0.6875rem] text-muted-foreground">
                    {BRAND_DOMAIN}
                  </p>
                </div>
                <MoreHorizontal className="ml-auto size-4 text-muted-foreground" aria-hidden />
              </div>
              <PreviewImage imageUrl={imageUrl} productName={post.productName} ratio="4 / 5" />
              <div className="flex items-center gap-4 px-3 pt-2.5 text-foreground" aria-hidden>
                <Heart className="size-5" />
                <MessageCircle className="size-5" />
                <Send className="size-5" />
                <Bookmark className="ml-auto size-5" />
              </div>
              <div className="space-y-1.5 px-3 pt-2 pb-3">
                {captionPreview}
                <span className="block text-xs text-muted-foreground">View all comments</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground">
                  <ThumbsUp className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold text-foreground">{BRAND_NAME}</p>
                  <p className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
                    {BRAND_DOMAIN}
                    <Globe className="size-2.5" aria-hidden />
                  </p>
                </div>
                <MoreHorizontal className="ml-auto size-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="px-3 pb-2.5">{captionPreview}</div>
              <PreviewImage imageUrl={imageUrl} productName={post.productName} ratio="1.91 / 1" />
              <div className="flex items-center justify-between gap-3 bg-muted px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
                    {BRAND_DOMAIN}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {post.productName}
                  </p>
                </div>
                <Button size="sm" className="shrink-0">
                  Shop now
                </Button>
              </div>
              <div
                className="grid grid-cols-3 border-t border-border text-muted-foreground"
                aria-hidden
              >
                <span className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium">
                  <ThumbsUp className="size-4" />
                  Like
                </span>
                <span className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium">
                  <MessageCircle className="size-4" />
                  Comment
                </span>
                <span className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium">
                  <Share2 className="size-4" />
                  Share
                </span>
              </div>
            </>
          )}
        </article>

          <VersionRail
            postId={post.postId}
            images={gallery}
            switching={switching}
            onSelect={(imageId) => void applyGalleryImage(imageId)}
            onUseOriginal={() => void applyOriginal()}
            onDelete={(imageId) => void removeGalleryImage(imageId)}
            inlineImages={inlineImages}
          />
        </div>

        {/* RIGHT — details + actions */}
        <div className="flex min-w-0 max-w-[68ch] flex-col gap-5">
          {/* pr-10 keeps the status pill clear of a dialog's absolute close button
              (top-2 right-2, size-7) when this view is rendered inside a Dialog;
              it's a harmless right pad when rendered inline (SPEC-144 fix 1). */}
          <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {post.productName}
              </p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                {isInstagram ? (
                  <Camera className="size-4" aria-hidden />
                ) : (
                  <ThumbsUp className="size-4" aria-hidden />
                )}
                {label} · {isInstagram ? "Portrait 4:5" : "Landscape 1.91:1"}
              </span>
            </div>
            <PostStatusChip status={status} />
          </div>

          {/* SPEC-173 — WHY this product. The most valuable line the page can
              show, and the one it was missing. */}
          {why && (
            <p className="inline-flex items-start gap-1.5 text-sm text-foreground">
              <ShoppingBag className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span>{why}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3.5" aria-hidden />
              {creative.persona}
            </span>
            <span className="inline-flex items-center gap-1">
              <GlispIcon className="size-3.5" aria-hidden />
              {creative.pillar}
            </span>
          </div>

          <div className="space-y-2">
            <PanelLabel>Angle</PanelLabel>
            <div className="flex flex-wrap items-center gap-1.5">
              {creative.captionVariants.map((variant) => {
                const active = variant.id === activeVariant?.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pickVariant(variant.id)}
                    className={cn(
                      "inline-flex h-7 items-center rounded-4xl px-3 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {variant.angle}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <PanelLabel>Caption</PanelLabel>
            {/* SPEC-173 — what you are about to publish, readable. It used to exist
                only inside the small preview, truncated. */}
            {!editing && !compact && (
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-foreground">
                  {caption}
                </p>
                {hashtagLine && (
                  <p className="mt-2.5 text-sm break-words text-primary">{hashtagLine}</p>
                )}
              </div>
            )}
            {editing ? (
              captionEditor
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {captionEditor}
                <RoleButton
                  need="social.manage"
                  variant="outline"
                  size="sm"
                  onClick={openRefine}
                >
                  <GlispIcon className="size-3.5" aria-hidden />
                  Refine
                </RoleButton>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <PanelLabel>Image</PanelLabel>
            {/* SPEC-173 — a blank area reads as broken; say which it is. */}
            {!serverImage && imgStatus !== "generating" && (
              <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
                No image yet — generate one, or upload your own.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {/* SPEC-187 — one entry point for everything that costs money, with
                  the state and the price shown before you spend. */}
              <RoleButton
                need="social.manage"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setMediaOpen(true)}
                disabled={imgStatus === "generating" || uploading || videoBusy}
              >
                {imgStatus === "generating" || uploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Working…
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-3.5" aria-hidden />
                    {serverImage ? "Image & video" : "Add image or video"}
                  </>
                )}
              </RoleButton>

            </div>

            {/* SPEC-174 — the Reel, watchable in place. Deliberately its OWN
                block rather than another entry in the Versions strip above:
                that strip means "this is what Approve publishes", and Approve
                publishes the image. */}
            {showVideoTile(videoStatus) && (
              <VideoTile
                status={videoStatus}
                error={videoError}
                durationSeconds={videoDuration}
                posterUrl={imageUrl}
                videoHref={videoUrl(post.postId, videoVersion)}
              />
            )}

            {/* SPEC-179 — the carousel, in publish order. Deliberately its own
                strip and never the Versions rail: that rail means "pick one",
                these are all live together. */}
            {showCarouselStrip(carouselStatus, slides.length) && (
              <CarouselStrip
                postId={post.postId}
                channel={post.channel}
                slides={slides}
                onOpen={setViewingSlide}
                concept={carouselConcept}
                status={carouselStatus}
                onDelete={(id) => void removeSlide(id)}
                deletingId={deletingSlide}
              />
            )}

            {/* SPEC-180 — the sequence, full size. Judging whether slide 3 earns
                the swipe from slide 2 cannot be done from 80px stamps. */}
            <CarouselViewer
              postId={post.postId}
              channel={post.channel}
              slides={slides}
              index={viewingSlide}
              onIndexChange={setViewingSlide}
              onClose={() => setViewingSlide(null)}
            />

            {/* SPEC-189 — the words she will actually say, readable BEFORE the
                clip finishes. Judging a UGC piece only once rendered means
                paying to discover the script was wrong. */}
            {videoBrief && <UgcBriefCard brief={videoBrief} />}

            {imgStatus === "error" && (
              <p role="alert" className="text-xs text-destructive">
                {imgError}
              </p>
            )}
            {uploadError && (
              <p role="alert" className="text-xs text-destructive">
                {uploadError}
              </p>
            )}
            {concept && serverImage && (
              <p className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
                <GlispIcon className="size-2.5 text-primary" aria-hidden />
                Scene: <span className="font-medium text-foreground">{concept}</span>
              </p>
            )}
          </div>

          {/* Schedule state + decision actions */}
          {schedule === "scheduled" && scheduledFor && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium text-success"
            >
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              Scheduled for {formatDate(scheduledFor)}
            </div>
          )}
          {/* SPEC-173 — never promise a date that has already passed. */}
          {schedule === "planned" && plannedMessage && (
            <p
              className={cn(
                "rounded-lg px-3 py-2 text-xs",
                plannedMessage.stale
                  ? "border border-warning/30 bg-warning/10 text-warning"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              {plannedMessage.stale ? (
                <>
                  {plannedMessage.text}{" "}
                  <Link href="/social?tab=calendar" className="font-medium underline underline-offset-4">
                    Open the Calendar
                  </Link>
                </>
              ) : (
                <>
                  {plannedMessage.text}{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(post.plannedFor!)}
                  </span>
                  .
                </>
              )}
            </p>
          )}
          {schedule === "approved-undated" && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              <span className="font-medium">Approved.</span>
              <Link
                href="/social?tab=calendar"
                className="inline-flex items-center gap-1 font-medium hover:underline"
              >
                Pick a date on the Calendar
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          )}

          {decisionError && (
            <p role="alert" className="text-sm text-destructive">
              {decisionError}
            </p>
          )}

          {/* SPEC-168 — the manual publish record. Shown only where the backend
              will accept it, so a control is never offered for a 409. */}
          {/* SPEC-180 — one-click publish, gated exactly as the backend gates it.
              Hidden entirely in manual-first mode (SPEC-184), where "I posted it"
              in the sticky bar is the action. */}
          {canPublishNow(status, hasImage, post.publishReady) && (
            <div className="flex flex-wrap gap-2">
              <RoleButton need="social.publish" onClick={publishNow} disabled={publishing}>
                {publishing ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {publishButtonLabel(publishing, Boolean(publishError))}
              </RoleButton>
            </div>
          )}

          {/* Shown whenever set, not only after an attempt: a post that failed at
              3am on the scheduler must explain itself when next opened. */}
          {publishError && (
            <p role="alert" className="text-sm text-destructive">
              {publishError}
            </p>
          )}

          {status === "published" && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {publishedLabel(publishedAt) && (
                <span className="text-sm text-muted-foreground">
                  {publishedLabel(publishedAt)}
                </span>
              )}
              {permalink && (
                <a
                  href={permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:underline"
                >
                  View post
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
              {canUnmarkPosted(status, postedManually) && (
                <RoleGate need="social.publish">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undoMarkPosted}
                    disabled={marking}
                  >
                    {marking ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : null}
                    Un-mark
                  </Button>
                </RoleGate>
              )}
            </div>
          )}
          {markError && !markOpen && (
            <p role="alert" className="text-sm text-destructive">
              {markError}
            </p>
          )}
        </div>
      </div>

      {/* SPEC-178 — progress lives here, top-right, not behind the modal. */}
      {showMediaToast(videoStatus) && !toastDismissed && (
        <MediaProgressToast
          title="Reel"
          channel={post.channel}
          status={videoStatus}
          stage={videoStage}
          error={videoError}
          onDismiss={() => setToastDismissed(true)}
        />
      )}

      {showMediaToast(carouselStatus) && !carouselToastDismissed && (
        <MediaProgressToast
          title="Carousel"
          channel={post.channel}
          status={carouselStatus}
          stage={carouselStage}
          error={carouselError}
          onDismiss={() => setCarouselToastDismissed(true)}
        />
      )}

      <MediaDialog
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        hasImage={serverImage}
        imageConcept={concept}
        videoStatus={videoStatus}
        videoError={videoError}
        refinement={refinement}
        onRefinementChange={setRefinement}
        onRegenerateImage={regenerateImage}
        onUploadImage={(file) => void uploadImage(file)}
        onGenerateVideo={() => void generateVideo()}
        carouselStatus={carouselStatus}
        carouselSlideCount={slides.length}
        onBuildCarousel={() => void buildCarousel()}
        carouselBusy={carouselBusy}
        imageBusy={imgStatus === "generating"}
        uploadBusy={uploading}
        videoBusy={videoBusy}
        error={uploadError}
        channelsLabel={label}
      />

      <MarkPostedDialog
        open={markOpen}
        link={markLink}
        saving={marking}
        error={markError}
        onLinkChange={setMarkLink}
        onOpenChange={(next) => {
          setMarkOpen(next);
          if (!next) setMarkError(null);
        }}
        onConfirm={confirmMarkPosted}
      />

      <RefinePostDialog
        open={refineOpen}
        onOpenChange={setRefineOpen}
        value={refineInstruction}
        onValueChange={setRefineInstruction}
        onRefine={refine}
        refining={refining}
        error={refineError}
      />
    </div>
  );
}

/* ── The loader/error wrapper (exported) ─────────────────────────────────── */

/**
 * The canonical single-post view (SPEC-138), reused by Content Studio, the
 * Weekly Plan board, and Approvals. Hand it a pre-loaded `initial` object to
 * render instantly, or just a `postId` to load it via `getPostDetail`. `onBack`
 * renders a back control; `onChanged` fires after any caption/image/decision
 * change so a parent list can refresh.
 */
export function PostDetail({
  postId,
  initial,
  onBack,
  onChanged,
  compact = false,
}: {
  postId: string;
  initial?: PostDetailData;
  onBack?: () => void;
  onChanged?: () => void;
  /** Rendered in a narrow column beside a sibling panel (the Content Studio's
   * "Both" view). The full layout puts the preview and the caption side by side;
   * stacked in a narrow column they would repeat the same paragraph twice, so
   * compact leans on the preview and drops the separate caption block. */
  compact?: boolean;
}) {
  const [data, setData] = useState<PostDetailData | null>(initial ?? null);
  const [phase, setPhase] = useState<"ready" | "loading" | "error">(
    initial ? "ready" : "loading",
  );

  // Load on mount when no pre-loaded object was handed in. Callers key this
  // component on `postId`, so a different post remounts it (initial phase =
  // "loading") rather than needing a synchronous reset here.
  useEffect(() => {
    if (initial) return;
    let active = true;
    getPostDetail(postId)
      .then((res) => {
        if (!active) return;
        setData(res);
        setPhase("ready");
      })
      .catch(() => {
        if (active) setPhase("error");
      });
    return () => {
      active = false;
    };
    // Load once per post id; `initial` is a mount-time seed only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const backControl = onBack && (
    <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onBack}>
      <ArrowLeft className="size-4" aria-hidden />
      Back
    </Button>
  );

  if (phase === "loading" || !data) {
    return (
      <div className="flex flex-col gap-4">
        {backControl}
        <div className="grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start">
          <Skeleton className="h-[28rem] w-full max-w-md rounded-card" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-3">
        {backControl}
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this post. Please try again.
          </p>
        </div>
      </div>
    );
  }

  // Keyed on post id so switching posts resets all the editing sub-state cleanly.
  return (
    <PostDetailView
      key={data.postId}
      post={data}
      onBack={onBack}
      onChanged={onChanged}
      compact={compact}
    />
  );
}
