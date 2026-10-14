"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { ProductPreview } from "@/features/auth/product-preview";
import { PRODUCT } from "@/lib/product";
import { CAROUSEL_SECONDS, nextSlide, type LoginMedia } from "@/lib/login-media";
import { cn } from "@/lib/utils";

/**
 * The login screen's left panel (SPEC-312 over backend SPEC-318): the platform's
 * own, or — when the address is the organization's login link, `/login?org=<slug>`
 * (SPEC-339: never a remembered one) — that organization's logo and its image, video or carousel. The carousel swaps its
 * slide in place (no entrance animation, root Rule 9) and its dots choose one.
 *
 * With no picture, video or carousel to show, it is the showcase (SPEC-312 Patches, the
 * owner's pick "03 · Product Peek"): a deep slate panel with a drawing of the app.
 */
export function BrandPanel({ media }: { media: LoginMedia | null }) {
  const [index, setIndex] = useState(0);
  const slides = media?.kind === "carousel" ? media.sources.length : 0;

  useEffect(() => {
    if (slides < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => nextSlide(current, slides)),
      CAROUSEL_SECONDS * 1000,
    );
    return () => window.clearInterval(timer);
  }, [slides]);

  const logo = media?.logoDark ?? media?.logoLight ?? null;
  const hasMedia = media !== null && media.kind !== "none";

  if (!hasMedia) return <Showcase name={media?.name ?? null} logo={logo} />;

  return (
    <div className="relative hidden w-1/2 overflow-hidden bg-scrim lg:block">
      {hasMedia && media.kind === "video" ? (
        <video
          className="absolute inset-0 size-full object-cover"
          src={media.sources[0]}
          poster={media.poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      ) : null}
      {hasMedia && media.kind !== "video"
        ? media.sources.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              aria-hidden
              fill
              unoptimized
              priority={i === 0}
              sizes="50vw"
              className={cn(
                "object-cover",
                media.kind === "carousel" && i !== index ? "invisible" : "visible",
              )}
            />
          ))
        : null}
      {hasMedia ? <div className="absolute inset-0 bg-scrim/60" aria-hidden /> : null}

      <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-12">
        {logo ? (
          <Image
            src={logo}
            alt={media?.name ?? ""}
            width={160}
            height={48}
            unoptimized
            priority
            className="h-12 w-auto object-contain object-left"
          />
        ) : (
          <BrandLogo size="lg" paper="var(--scrim)" className="text-scrim-foreground" />
        )}
        <div className="max-w-md space-y-3">
          <span className="block h-1 w-10 rounded-full bg-brand" aria-hidden />
          <p className="font-heading text-4xl leading-tight tracking-wide text-scrim-foreground">
            {`Welcome to ${media.name}.`}
          </p>
          <p className="text-sm leading-relaxed text-scrim-foreground/80">
            Sales, products, customers, inventory and returns — analyzed for you and explained in
            plain language, every day.
          </p>
          {slides > 1 ? (
            <div className="flex gap-2 pt-2">
              {media?.sources.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Show picture ${i + 1} of ${slides}`}
                  aria-pressed={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "size-2 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    i === index ? "bg-scrim-foreground" : "bg-scrim-foreground/40",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The platform's own panel (the owner's pick "R5 · Red Band"): marketing-site paper above, a
 * brand-red band below, and the drawing of the app across the two. */
function Showcase({ name, logo }: { name: string | null; logo: string | null }) {
  return (
    <div className="relative hidden w-1/2 overflow-hidden bg-showcase text-showcase-foreground lg:block">
      <svg className="absolute inset-0 size-full text-showcase-foreground" aria-hidden>
        <defs>
          <pattern id="showcase-hex" width="45" height="78" patternUnits="userSpaceOnUse">
            <path d="M22.5 0 45 13v26L22.5 52 0 39V13zM22.5 52v26" fill="none" stroke="currentColor" strokeOpacity="0.06" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#showcase-hex)" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-showcase-band" aria-hidden />

      <div className="relative flex h-full flex-col py-12 pl-14">
        {logo ? (
          <Image
            src={logo}
            alt={name ?? ""}
            width={160}
            height={48}
            unoptimized
            priority
            className="h-12 w-auto object-contain object-left"
          />
        ) : (
          <BrandLogo size="lg" paper="var(--showcase)" className="text-showcase-foreground" />
        )}
        <div className="mt-16">
          <ProductPreview />
        </div>
        <div className="mt-auto max-w-xl space-y-4 pr-14 text-showcase-band-foreground">
          <p className="font-mono text-xs tracking-widest text-showcase-band-muted uppercase">
            [ {PRODUCT.descriptor} ]
          </p>
          <p className="font-display text-5xl leading-none tracking-tight">
            {name ? `Welcome to ${name}.` : `${PRODUCT.tagline}.`}
          </p>
          <p className="text-base leading-relaxed">
            Sales, products, customers, inventory and returns — refreshed every 15 minutes and
            explained in plain language.
          </p>
        </div>
      </div>
    </div>
  );
}
