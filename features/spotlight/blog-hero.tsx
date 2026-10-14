"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { resolveHeroImage } from "@/lib/spotlight";

/**
 * The Minimal-Luxury (L5) hero (SPEC-153): a full-width **textless** cinematic
 * image band that sits BELOW the centered title block (the title is no longer
 * overlaid on the image — that lives above it now). Reuses the same image logic
 * as {@link BlogBanner}: it shows the served art-directed hero
 * (`heroUrl(draft.id, heroVersion)`) when it loads, falling back to the featured
 * product photo, then to a **compact placeholder** (SPEC-153 patch). An invisible
 * `<img>` probes the hero URL so a broken/absent hero falls back cleanly, and its
 * load/error drive the caller's "Generate vs Regenerate header" label
 * (`onHeroLoad`/`onHeroError`).
 *
 * No scrim, no overlaid copy — quiet luxury. `aspect-[3/2]` for the generated
 * hero (gpt-image is a fixed 3:2, so this never crops it); a capped tall band for
 * the product-photo fallback. When there is **no image at all** it never renders a
 * giant empty gradient — instead a short placeholder band with a centered prompt
 * inviting the "Generate header" action. CSS-only (Rule 9): no entrance animation,
 * tokens only, correct in both themes.
 */
export function BlogHero({
  imageUrl,
  heroUrl,
  generating = false,
  onHeroLoad,
  onHeroError,
}: {
  imageUrl: string | null;
  heroUrl?: string | null;
  generating?: boolean;
  onHeroLoad?: () => void;
  onHeroError?: () => void;
}) {
  // Reset the fallback flag when a new hero URL arrives, via the React-documented
  // "adjust state during render" pattern (no effect, no cascading render) — the
  // same approach BlogBanner uses.
  const [heroFailed, setHeroFailed] = useState(false);
  const [seenHeroUrl, setSeenHeroUrl] = useState(heroUrl);
  if (heroUrl !== seenHeroUrl) {
    setSeenHeroUrl(heroUrl);
    setHeroFailed(false);
  }

  const { backgroundImage, showHero, hasImage } = resolveHeroImage(
    heroUrl,
    heroFailed,
    imageUrl,
  );

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-muted",
        showHero
          // A FIXED 2:1 banner (SPEC-165 Patch 7). The asset is generated 3:2
          // (1536x1024 — the widest gpt-image-1 offers), so the banner always
          // crops top and bottom; the hero prompt is written for exactly that and
          // reserves safe margins. What matters is that the crop ratio is
          // CONSTANT, so the prompt can name it: a `vh` cap made the ratio depend
          // on the viewport, which is unstateable in a prompt and is why the
          // subject was being decapitated at some window sizes.
          // At 2:1 roughly 75% of the image height survives, against ~64% at the
          // previous 70vh cap — a materially gentler crop.
          // `w-full` is load-bearing: with only a ratio and a max-height the width
          // is auto, so the browser derives it from the CLAMPED height and the
          // hero shrinks sideways into a small left-aligned block.
          ? "aspect-[2/1] max-h-[720px] w-full"
          : hasImage
            ? "h-[46vh] min-h-[300px] md:h-[54vh] lg:h-[62vh] lg:max-h-[680px]"
            : // No image at all: a compact placeholder, never a giant empty band.
            "h-[34vh] max-h-[360px] min-h-[220px]",
      )}
    >
      {backgroundImage ? (
        <div
          className={cn(
            "absolute inset-0 bg-cover bg-no-repeat bg-[position:center_42%]",
            generating && "scale-[1.01]",
          )}
          style={{ backgroundImage: `url("${backgroundImage}")` }}
          onLoad={onHeroLoad}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary"
          aria-hidden
        />
      )}

      {/* Compact empty state (SPEC-153 patch): no served hero and no product photo.
          A short, tasteful prompt inviting the "Generate header" action rather than
          a broken-looking blank. Hidden while generating (the overlay covers it). */}
      {!hasImage && !generating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <ImageIcon className="size-6 text-muted-foreground/70" aria-hidden />
          <p className="font-heading text-base text-muted-foreground md:text-lg">
            Design a magazine header for this post
          </p>
        </div>
      )}

      {/* Invisible probe: detects a broken/absent hero URL while the real hero
          renders as a CSS background. */}
      {showHero && (
        <img
          src={heroUrl as string}
          alt=""
          aria-hidden
          className="hidden"
          onLoad={onHeroLoad}
          onError={() => {
            setHeroFailed(true);
            onHeroError?.();
          }}
        />
      )}

      {/* Generation overlay (CSS pulse only). */}
      {generating && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 backdrop-blur-[1px]"
          aria-hidden
        >
          <span className="animate-pulse text-sm font-medium text-white/90">
            Designing your header…
          </span>
        </div>
      )}
    </section>
  );
}
