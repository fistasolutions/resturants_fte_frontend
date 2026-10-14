"use client";

import { useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GalleryHorizontalEnd,
  ImagePlus,
  Loader2,
  Upload,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { UPLOAD_ACCEPT_ATTR } from "@/lib/social-manual";
import {
  videoBlockedReason,
  videoReferenceWarning,
  videoStatusLabel,
} from "@/lib/social-media";
import {
  carouselBlockedReason,
  carouselButtonLabel,
} from "@/lib/social-carousel";

/**
 * One place for everything that costs money (SPEC-187 / frontend).
 *
 * Before this, media controls were scattered across the panel — Regenerate,
 * Download, Upload — and "Regenerate" was **blind**: you clicked, you got a
 * different scene, you had no say. The caption has Refine; the image did not.
 *
 * Three things this fixes:
 *  - it shows the state BEFORE you spend (image done, video not, what each costs);
 *  - it gives regeneration a refinement prompt, the way the caption already has;
 *  - it enforces the one hard rule — video animates the still, so the still must
 *    exist first — with the reason written on the control rather than a silently
 *    disabled button.
 */
export function MediaDialog({
  open,
  onOpenChange,
  hasImage,
  imageConcept,
  videoStatus,
  videoError,
  refinement,
  onRefinementChange,
  onRegenerateImage,
  onUploadImage,
  onGenerateVideo,
  carouselStatus,
  carouselSlideCount,
  onBuildCarousel,
  carouselBusy,
  imageBusy,
  uploadBusy,
  videoBusy,
  error,
  channelsLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasImage: boolean;
  imageConcept: string | null;
  videoStatus: string;
  videoError?: string | null;
  refinement: string;
  onRefinementChange: (value: string) => void;
  onRegenerateImage: () => void;
  onUploadImage: (file: File) => void;
  onGenerateVideo: () => void;
  carouselStatus: string;
  carouselSlideCount: number;
  onBuildCarousel: () => void;
  carouselBusy: boolean;
  imageBusy: boolean;
  uploadBusy: boolean;
  videoBusy: boolean;
  error: string | null;
  /** e.g. "Instagram + Facebook" — the scope of what these buttons affect. */
  channelsLabel: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const blocked = videoBlockedReason(hasImage, videoStatus);
  const referenceWarning = videoReferenceWarning(hasImage);
  const carouselBlocked = carouselBlockedReason(hasImage, carouselStatus);
  const busy = imageBusy || uploadBusy || videoBusy || carouselBusy;

  /**
   * SPEC-178: a generate CLOSES this dialog. Progress belongs in the toast, not
   * behind a modal the owner has to sit on for three minutes — and the finished
   * reel belongs in the panel underneath, which the modal was covering.
   */
  function run(action: () => void) {
    action();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return; // don't lose a running job's state
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Media for this post</DialogTitle>
          <DialogDescription>
            Applies to {channelsLabel}. Progress appears at the top right once you
            start.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Image ─────────────────────────────────────────────────── */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <ImagePlus className="size-4 text-muted-foreground" aria-hidden />
                Image
              </span>
              {hasImage ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Generated
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Not generated</span>
              )}
            </div>
            {imageConcept && (
              <p className="mt-1 text-xs text-muted-foreground">
                Scene: {imageConcept}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => run(onRegenerateImage)}
                disabled={busy}
              >
                {imageBusy ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Building scene…
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-3.5" aria-hidden />
                    {hasImage ? "Regenerate" : "Generate image"}
                  </>
                )}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept={UPLOAD_ACCEPT_ATTR}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) onUploadImage(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
              >
                {uploadBusy ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" aria-hidden />
                    Upload your own
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── Video ─────────────────────────────────────────────────── */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <Video className="size-4 text-muted-foreground" aria-hidden />
                Video
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  videoStatus === "ready"
                    ? "text-success"
                    : videoStatus === "failed"
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
              >
                {videoStatusLabel(videoStatus, videoError)}
              </span>
            </div>
            {/* SPEC-178 — there is no longer a mode to choose. A reel is a
                person on camera saying a written line; "Animate the photo" was
                removed by owner decision. Two 8-second halves, ~16s, vertical. */}
            <p className="mt-1 text-xs text-muted-foreground">
              A person on camera saying a written line. ~16s, vertical.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => run(onGenerateVideo)}
                disabled={busy || blocked !== null}
              >
                {videoBusy ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Starting…
                  </>
                ) : (
                  <>
                    <Video className="size-3.5" aria-hidden />
                    {videoStatus === "ready" ? "Regenerate video" : "Generate video"}
                  </>
                )}
              </Button>
            </div>
            {(blocked || referenceWarning) && (
              <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {blocked ?? referenceWarning}
              </p>
            )}
          </div>

          {/* ── Carousel ──────────────────────────────────────────────── */}
          {/* SPEC-179 — the third thing a post can produce. A third BLOCK, not a
              fourth mode picker: SPEC-178 deleted one of those and the button
              simply says what it makes. Every slide is edited from the approved
              image, which is why this is unavailable without one. */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <GalleryHorizontalEnd className="size-4 text-muted-foreground" aria-hidden />
                Carousel
              </span>
              <span className="text-xs text-muted-foreground">
                {carouselSlideCount > 0
                  ? `${carouselSlideCount} slide${carouselSlideCount === 1 ? "" : "s"}`
                  : "None yet"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Three to five slides that build an argument — the hook, how it fits,
              the detail — all from the image above, so they look like one shoot.
            </p>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => run(onBuildCarousel)}
                disabled={busy || carouselBlocked !== null}
              >
                {carouselBusy ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Starting…
                  </>
                ) : (
                  <>
                    <GalleryHorizontalEnd className="size-3.5" aria-hidden />
                    {carouselButtonLabel(carouselSlideCount)}
                  </>
                )}
              </Button>
            </div>
            {carouselBlocked && (
              <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {carouselBlocked}
              </p>
            )}
          </div>

          {/* ── Refinement ────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label
              htmlFor="media-refinement"
              className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase"
            >
              What should change? (optional)
            </label>
            <Textarea
              id="media-refinement"
              rows={2}
              value={refinement}
              disabled={busy}
              onChange={(event) => onRefinementChange(event.target.value)}
              placeholder="warmer light · product only, no model · less busy background"
              className="resize-y text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Applies to the next generate. Leave empty for a fresh take.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
