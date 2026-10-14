"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DOC_SCREENS, type DocScreenKey } from "@/lib/docs/screens";
import { cn } from "@/lib/utils";

/** Above this height-to-width ratio a capture is more than one viewport tall and
 * gets clamped with a fade — a 4,000px inventory page must not become 4,000px
 * of article (SPEC-229). Below it the figure renders whole. */
const CLAMP_RATIO = 0.75;

interface DocScreenProps {
  screen: DocScreenKey;
  /** Reads as the figure's caption and the dialog's title. */
  title: string;
  caption: string;
  /** Larger sizes hint for the hero figure, which spans the article column. */
  priority?: boolean;
}

/**
 * A real capture of the live app, framed, clamped when tall, expandable to its
 * full height in a scrollable dialog. `next/image` with explicit dimensions so
 * nothing shifts as it loads; alt text is the caption, never empty.
 */
export function DocScreen({ screen, title, caption, priority = false }: DocScreenProps) {
  const { src, width, height } = DOC_SCREENS[screen];
  const tall = height / width > CLAMP_RATIO;
  const alt = `${title} — ${caption}`;

  return (
    <figure className="space-y-2">
      <Dialog>
        <div
          className={cn(
            "relative overflow-hidden rounded-card border border-border bg-muted/40",
            tall && "max-h-[34rem]",
          )}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            sizes="(min-width: 1280px) 56rem, (min-width: 1024px) 60vw, 100vw"
            className="block h-auto w-full"
          />
          {tall && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
            />
          )}
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-3 bottom-3 shadow-sm"
            >
              <Maximize2 aria-hidden />
              {tall ? "Expand full page" : "Expand"}
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="max-h-[92vh] gap-2 overflow-y-auto p-3 sm:max-w-[min(96vw,80rem)]">
          <DialogHeader className="pr-8">
            <DialogTitle className="font-heading text-lg tracking-wide">{title}</DialogTitle>
            <DialogDescription>{caption}</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg border border-border">
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              sizes="96vw"
              className="block h-auto w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
      <figcaption className="text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
