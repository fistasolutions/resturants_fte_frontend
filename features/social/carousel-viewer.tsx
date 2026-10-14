"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  atFirstSlide,
  atLastSlide,
  slideAspectClass,
  slideCounter,
  slideJobLabel,
  stepSlide,
} from "@/lib/social-carousel";
import { slideImageUrl } from "@/services/social-actions";
import type { CarouselSlide } from "@/types/social";

/**
 * The carousel, full size and in order (SPEC-180).
 *
 * `SPEC-179` shipped the strip and stopped one step short: three 80px thumbnails
 * with no click target, so the owner could tell a carousel existed but could not
 * look at it. Asked "how do I see it?", the honest answer was that he could not.
 *
 * Opening one slide opens the whole SEQUENCE positioned there, because the thing
 * being judged is the argument — whether slide 3 earns the swipe from slide 2 —
 * and that cannot be judged one still at a time.
 */
export function CarouselViewer({
  postId,
  channel,
  slides,
  index,
  onIndexChange,
  onClose,
}: {
  postId: string;
  /** Decides the frame: Instagram 4:5, Facebook 1.91:1 — what Meta will show. */
  channel: string;
  slides: CarouselSlide[];
  /** The slide being shown, or null when the viewer is closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const open = index !== null;
  const total = slides.length;
  const current = open ? slides[index] : undefined;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange(stepSlide(index, total, delta));
    },
    [index, total, onIndexChange],
  );

  // Arrow keys, because a sequence is walked, not clicked. Escape is shadcn's.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  if (!open || !current) return null;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Slide {slideCounter(index, total)}
          </DialogTitle>
          <DialogDescription>
            {slideJobLabel(current.position, current.job)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => step(-1)}
            disabled={atFirstSlide(index)}
            aria-label="Previous slide"
            className="shrink-0"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>

          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-foreground/5",
              slideAspectClass(channel),
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slideImageUrl(postId, current.id)}
              alt={`Slide ${current.position}: ${slideJobLabel(current.position, current.job)}`}
              className="size-full object-cover"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => step(1)}
            disabled={atLastSlide(index, total)}
            aria-label="Next slide"
            className="shrink-0"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        {/* Position dots: which slide of how many, at a glance, and a way to jump
            straight to one rather than stepping through. */}
        <div className="flex justify-center gap-1.5">
          {slides.map((slide, position) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => onIndexChange(position)}
              aria-label={`Go to slide ${position + 1}`}
              aria-current={position === index}
              className={cn(
                "size-2 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                position === index ? "bg-primary" : "bg-border hover:bg-primary/40",
              )}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
