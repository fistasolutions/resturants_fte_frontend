"use client";

import { cn } from "@/lib/utils";
import { SOCIAL_CATEGORIES } from "@/lib/social-catalog";
import type { SocialCategory } from "@/types/social";

/**
 * Content Studio left rail (SPEC-135): the commerce-signal categories, and
 * nothing else. Selecting a category is what drives the right-hand product
 * browser. Plain focusable buttons (Tab + Enter/Space) with `aria-pressed` on
 * the active one — keyboard-navigable without the tablist roving-tabindex
 * contract, since these filter a browser rather than swap ARIA tabpanels.
 *
 * Layout: a fixed-width vertical column on `lg+`; below `lg` it collapses to a
 * single horizontally-scrolling segmented bar at the top.
 */
export function CategoryNavRail({
  category,
  onSelect,
}: {
  category: SocialCategory;
  onSelect: (next: SocialCategory) => void;
}) {
  return (
    <nav aria-label="Product categories" className="lg:sticky lg:top-4 lg:self-start">
      <p className="mb-2 hidden px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase lg:block">
        Categories
      </p>
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-x-visible lg:px-0 lg:pb-0">
        {SOCIAL_CATEGORIES.map(({ id, label }) => {
          const active = id === category;
          return (
            <li key={id} className="shrink-0 lg:shrink">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(id)}
                className={cn(
                  "inline-flex h-9 w-full items-center rounded-lg border px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:justify-start",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
