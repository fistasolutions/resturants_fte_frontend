import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { BRAND_BRAIN_ROOT, brandBrainHref } from "@/lib/brand-brain";
import type { BrandBrainSection } from "@/types/brand-brain";

/**
 * The site's breadcrumb (Products › Catalog › product) for a Brand Brain detail page
 * (SPEC-274): Spotlight › Brand Brain › the sub-tab › the item.
 */
export function BrandBrainBreadcrumb({ section, sectionLabel, current }: { section: BrandBrainSection; sectionLabel: string; current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/spotlight" className="transition-colors hover:text-foreground">
        Search Visibility
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <Link href={`${BRAND_BRAIN_ROOT}/coverage`} className="transition-colors hover:text-foreground">
        Brand Brain
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <Link href={brandBrainHref(section)} className="transition-colors hover:text-foreground">
        {sectionLabel}
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <span className="max-w-[60ch] truncate font-medium text-foreground" aria-current="page">
        {current}
      </span>
    </nav>
  );
}

/** The breadcrumb for a Brand Brain sub-tab itself (SPEC-341, Review): Spotlight › Brand Brain ›
 * the sub-tab. */
export function BrandBrainSectionBreadcrumb({ label }: { label: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/spotlight" className="transition-colors hover:text-foreground">
        Search Visibility
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <Link href={`${BRAND_BRAIN_ROOT}/coverage`} className="transition-colors hover:text-foreground">
        Brand Brain
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <span className="font-medium text-foreground" aria-current="page">
        {label}
      </span>
    </nav>
  );
}
