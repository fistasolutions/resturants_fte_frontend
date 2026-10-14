"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { shopifyImageUrl } from "@/lib/spotlight";

export function BlogBanner({
  imageUrl,
  heroUrl,
  eyebrow,
  title,
  byline,
  generating = false,
  onHeroLoad,
  onHeroError,
}: {
  imageUrl: string | null;
  heroUrl?: string | null;
  eyebrow: string;
  title: string;
  byline?: React.ReactNode;
  generating?: boolean;
  onHeroLoad?: () => void;
  onHeroError?: () => void;
}) {
  // Reset the fallback flag when a new hero URL arrives, via the React-documented
  // "adjust state during render" pattern (no effect, no cascading render).
  const [heroFailed, setHeroFailed] = useState(false);
  const [seenHeroUrl, setSeenHeroUrl] = useState(heroUrl);
  if (heroUrl !== seenHeroUrl) {
    setSeenHeroUrl(heroUrl);
    setHeroFailed(false);
  }

  const showHero = Boolean(heroUrl) && !heroFailed;

  const backgroundImage = showHero
    ? heroUrl
    : imageUrl
      ? shopifyImageUrl(imageUrl, 2000)
      : null;

  return (
    <section
      className={cn(
        "relative -mx-5 -mt-5 mb-6 overflow-hidden",
        "border-b border-border",
        "md:-mx-8 md:-mt-8",
        // The generated hero is a fixed 3:2 (1536×1024) and gpt-image has no wider
        // size, so the ONLY way to never cut it is to match the banner to that exact
        // ratio — then bg-cover fills it with zero crop and zero letterbox. Capped on
        // very large screens so it stays a hero, not a full-screen image.
        showHero
          ? "aspect-[3/2]"
          : "h-[360px] sm:h-[400px] md:h-[460px] lg:h-[520px]",
      )}
    >
      {/* Background image */}
      {backgroundImage ? (
        <div
          className={cn(
            "absolute inset-0",
            "bg-cover bg-no-repeat",
            // Keeps the important subject slightly above center.
            // Adjust to 40% / 45% depending on the generated image.
            "bg-[position:center_42%]",
            generating && "scale-[1.01]",
          )}
          style={{
            backgroundImage: `url("${backgroundImage}")`,
          }}
          onLoad={onHeroLoad}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary"
          aria-hidden
        />
      )}

      {/* Invisible image loader.
          This lets us detect broken generated hero URLs while
          keeping the actual hero rendered as a CSS background. */}
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

      {/* Dark editorial scrim */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5"
        aria-hidden
      />

      {/* Optional generation overlay */}
      {generating && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-[1px]"
          aria-hidden
        >
          <span className="animate-pulse text-sm font-medium text-white/90">
            Designing your header…
          </span>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "relative z-10 flex h-full flex-col justify-end",
          "p-5 md:p-8",
          "pb-7 md:pb-9",
        )}
      >
        <div className="max-w-4xl">
          {eyebrow && (
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-white/80">
              {eyebrow}
            </p>
          )}

          <h1
            className={cn(
              "font-heading text-balance text-2xl tracking-tight text-white",
              "sm:text-3xl",
              "md:text-4xl",
              "lg:text-[42px]",
              "leading-[1.08]",
            )}
          >
            {title}
          </h1>

          {byline && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/80">
              {byline}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}