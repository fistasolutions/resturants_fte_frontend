"use client";

import { Loader2, Trash2 } from "lucide-react";

import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  carouselHeading,
  carouselPublishNote,
  slideAspectClass,
  slideJobLabel,
} from "@/lib/social-carousel";
import { slideImageUrl } from "@/services/social-actions";
import type { CarouselSlide } from "@/types/social";

/**
 * The carousel, in publish order (SPEC-179).
 *
 * Deliberately NOT the Versions rail. That rail means "pick one — this is what
 * Approve publishes", and exactly one is selected; these are all live, in order,
 * and publish together as a single post. Sharing a strip would destroy the
 * meaning of both.
 *
 * Each card shows its number and the job the director gave it — "how it fits",
 * "the fabric" — so the owner reads the *argument* rather than four pictures.
 */
export function CarouselStrip({
  postId,
  channel,
  slides,
  concept,
  status,
  onOpen,
  onDelete,
  deletingId,
}: {
  postId: string;
  /** Decides the tile's frame: Instagram 4:5, Facebook 1.91:1. */
  channel: string;
  slides: CarouselSlide[];
  concept?: string | null;
  status: string;
  /** Open the viewer at this slide (SPEC-180). */
  onOpen: (index: number) => void;
  onDelete: (slideId: number) => void;
  /** The slide currently being removed, so only its own control spins. */
  deletingId: number | null;
}) {
  const note = carouselPublishNote(slides.length);

  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-xs text-muted-foreground">
        {carouselHeading(concept, slides.length)}
        {status === "generating" && " · still building"}
      </p>

      <ul className="flex flex-wrap gap-2">
        {slides.map((slide, index) => (
          <li key={slide.id} className="w-20">
            <div className="relative overflow-hidden rounded-lg border-2 border-border">
              {/* SPEC-180 — clickable, and in the post's real frame. These were
                  square thumbnails over portrait slides, so every tile was
                  centre-cropped: the strip misrepresenting what Meta will show. */}
              <button
                type="button"
                onClick={() => onOpen(index)}
                aria-label={`View slide ${slide.position}: ${slideJobLabel(slide.position, slide.job)}`}
                className={cn(
                  "block w-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  slideAspectClass(channel),
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slideImageUrl(postId, slide.id)}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
              <span className="pointer-events-none absolute top-1 left-1 rounded bg-foreground/70 px-1 text-[9px] font-medium text-background tabular-nums">
                {slide.position}
              </span>
              {/* Slide 1 is the approved image itself — deleting it would leave
                  the sequence with no hero to have been edited from. */}
              {slide.position > 1 && (
                <RoleGate need="social.manage">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0.5 right-0.5 size-5 bg-background/70 hover:bg-background"
                    onClick={() => onDelete(slide.id)}
                    disabled={deletingId !== null}
                    aria-label={`Delete slide ${slide.position}`}
                  >
                    {deletingId === slide.id ? (
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-3" aria-hidden />
                    )}
                  </Button>
                </RoleGate>
              )}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {slideJobLabel(slide.position, slide.job)}
            </p>
          </li>
        ))}
        {status === "generating" && (
          <li
            className={cn(
              "grid w-20 place-items-center rounded-lg border-2 border-dashed border-border",
              slideAspectClass(channel),
            )}
            aria-hidden
          >
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </li>
        )}
      </ul>

      {note && <p className="text-[10px] text-warning">{note}</p>}
    </div>
  );
}
