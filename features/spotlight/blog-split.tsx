import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { shopifyImageUrl } from "@/lib/spotlight";
import type { BlogSection } from "@/lib/spotlight";
import type { BlogDraftProduct } from "@/types/spotlight";

import { BlogMarkdown } from "./blog-markdown";

/**
 * The Minimal-Luxury (L5) image/text split (SPEC-153) — the magazine contrast: a
 * real grounded product image beside a `bg-secondary` text pane. Built ONLY from
 * a section the article already wrote and a product the agent grounded on (never
 * invented; root Rule 8). The pane sub-head is the section heading (rendered in
 * `font-heading`, carrying the section's slug `id` + `scroll-mt-24` so deep links
 * still land), and the pane prose is the section body with its heading line
 * stripped (so the heading is never shown twice).
 *
 * Stacks on mobile (image over pane), a 2-up grid from `md`. CSS-only hover
 * (Rule 9): a subtle cover-zoom on the image; tokens only, correct in both themes.
 */
export function BlogSplit({
  section,
  product,
  eyebrow,
}: {
  section: BlogSection;
  product: BlogDraftProduct;
  eyebrow?: string;
}) {
  // The section body starts with its `## heading` line (splitBodyIntoSections);
  // strip it so the pane shows the heading once (as the font-heading sub-head).
  const paneBody = section.body.replace(/^\s*#{2,6}\s+.*(?:\r?\n)?/, "").trim();
  const hasImage = Boolean(product.imageUrl);

  const media = hasImage ? (
    <div className="relative min-h-[18rem] overflow-hidden md:min-h-[26rem]">
      <Image
        src={shopifyImageUrl(product.imageUrl as string, 1000)}
        alt=""
        aria-hidden
        fill
        unoptimized
        loading="lazy"
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
      />
    </div>
  ) : (
    <div
      className="min-h-[18rem] bg-gradient-to-br from-secondary via-muted to-secondary md:min-h-[26rem]"
      aria-hidden
    />
  );

  return (
    <figure className="group grid grid-cols-1 overflow-hidden rounded-lg border border-border md:grid-cols-2">
      {media}
      <div className="flex flex-col justify-center bg-secondary p-8 md:p-12">
        {eyebrow && (
          <p className="mb-4 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h3
          id={section.id}
          className="font-heading scroll-mt-24 text-2xl tracking-tight text-foreground md:text-3xl"
        >
          {section.heading}
        </h3>
        {paneBody && (
          <div className="mt-4 text-secondary-foreground">
            <BlogMarkdown content={paneBody} />
          </div>
        )}
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Shop {product.title}
            <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
          </a>
        )}
      </div>
    </figure>
  );
}
