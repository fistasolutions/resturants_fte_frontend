"use client";

import { useState } from "react";
import { AlertTriangle, Download, Loader2, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  videoDurationLabel,
  videoStatusLabel,
  videoTileDisabled,
} from "@/lib/social-media";

/**
 * Watch the generated Reel without leaving the page (SPEC-174).
 *
 * Before this the only way to see a video the product had just generated was to
 * download the mp4 and open it in a desktop player — leaving the product to
 * review the product's own output.
 *
 * Two things this deliberately does NOT do, both covered in the spec:
 *  - it does not join the "Versions · click one to use it" strip, because that
 *    strip means "this is what Approve publishes" and Approve publishes the
 *    image (Reels are a different Meta container, out of scope in SPEC-187);
 *  - it does not play inside the post preview frame, because that frame is 4:5
 *    or 1.91:1 and a Reel is 9:16 — the wrong crop would misrepresent the post.
 */
export function VideoTile({
  status,
  error,
  durationSeconds,
  posterUrl,
  videoHref,
}: {
  status: string;
  error?: string | null;
  durationSeconds?: number | null;
  /** The still the video was animated from — recognisable before it plays. */
  posterUrl: string | null;
  /** The mp4, used by both the player and the save link. */
  videoHref: string;
}) {
  const [playing, setPlaying] = useState(false);
  const disabled = videoTileDisabled(status);

  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-xs text-muted-foreground">
        Reel · post by hand — Approve sends the image.
      </p>

      {playing ? (
        <div className="space-y-1.5">
          {/* 9:16, the shape a Reel actually posts in. Capped so it never
              dominates the two-column Studio layout. */}
          <div className="relative w-40 overflow-hidden rounded-lg border border-border bg-foreground/5">
            <video
              src={videoHref}
              poster={posterUrl ?? undefined}
              controls
              autoPlay
              playsInline
              className="aspect-9/16 w-full object-cover"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0.5 text-[10px] text-muted-foreground"
            onClick={() => setPlaying(false)}
          >
            <X className="size-2.5" aria-hidden />
            Close
          </Button>
        </div>
      ) : (
        <div className="w-fit">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPlaying(true)}
            aria-label={
              disabled
                ? videoStatusLabel(status, error)
                : `Play the ${videoDurationLabel(durationSeconds)} Reel`
            }
            className={cn(
              "relative block h-28 w-16 overflow-hidden rounded-lg border-2 border-border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              disabled ? "cursor-default opacity-70" : "hover:border-primary/50",
            )}
          >
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="block size-full bg-foreground/5" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-foreground/25">
              {status === "generating" ? (
                <Loader2 className="size-5 animate-spin text-background" aria-hidden />
              ) : status === "failed" ? (
                <AlertTriangle className="size-5 text-background" aria-hidden />
              ) : (
                <Play className="size-5 fill-background text-background" aria-hidden />
              )}
            </span>
            {status === "ready" && (
              <span className="absolute right-1 bottom-1 rounded bg-foreground/70 px-1 text-[9px] font-medium text-background tabular-nums">
                {videoDurationLabel(durationSeconds)}
              </span>
            )}
          </button>

          {status === "ready" ? (
            <a
              href={videoHref}
              download
              aria-label="Download this Reel"
              className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <Download className="size-2.5" aria-hidden />
              save
            </a>
          ) : (
            /* SPEC-178 patch — a failure is READ in the toast. This used to
               print the whole sentence in red under the thumbnail, which said
               it twice and reflowed the column every time a job failed. One
               quiet word here; the reason is on hover and on the button's own
               aria-label above. */
            <p
              role="status"
              title={status === "failed" ? videoStatusLabel(status, error) : undefined}
              className={cn(
                "mt-1 text-[10px]",
                status === "failed"
                  ? "cursor-help text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {status === "generating" ? "Generating…" : "Failed"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
