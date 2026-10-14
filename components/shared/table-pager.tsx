"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { pageRange, pageWindow } from "@/lib/table-controls";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

interface TablePagerProps {
  page: number;
  pages: number;
  pageSize: number;
  matches: number;
  noun: string;
  onPage: (page: number) => void;
}

const CONTROL =
  "rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

/**
 * Prev · windowed page numbers · Next under a loaded table (SPEC-258). Renders
 * nothing when everything fits on one page. Plain buttons on component state — a
 * click re-renders the table, never the route. When the table's top has scrolled
 * out of view, a page change brings it back so the reader lands on row one of the
 * new page, not on the pager.
 */
export function TablePager({ page, pages, pageSize, matches, noun, onPage }: TablePagerProps) {
  const nav = useRef<HTMLElement>(null);
  if (pages <= 1) return null;
  const [first, last] = pageRange({ page, pageSize, matches });
  const go = (next: number) => {
    onPage(next);
    const card = nav.current?.closest("[data-slot=card]");
    if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: "start" });
  };
  return (
    <nav ref={nav} aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2.5">
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatNumber(first)}–{formatNumber(last)} of {formatNumber(matches)} {noun}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={cn(CONTROL, "flex items-center gap-1")}
        >
          <ChevronLeft className="size-4" aria-hidden /> Prev
        </button>
        {pageWindow(page, pages).map((entry, i) =>
          entry === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => go(entry)}
              aria-current={entry === page ? "page" : undefined}
              aria-label={`Page ${entry}`}
              className={cn(
                CONTROL,
                "min-w-8 tabular-nums",
                entry === page && "border-foreground bg-foreground text-background hover:text-background",
              )}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className={cn(CONTROL, "flex items-center gap-1")}
        >
          Next <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
