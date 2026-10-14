import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { docHref, docNeighbors } from "@/lib/docs";

/** Previous / next across the whole reading order (SPEC-229). */
export function DocPager({ slug }: { slug: string }) {
  const { previous, next } = docNeighbors(slug);
  return (
    <nav aria-label="Previous and next" className="grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {previous ? (
        <Link
          href={docHref(previous.slug)}
          className="group flex items-center gap-3 rounded-card border border-border px-4 py-3 transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
          <span className="min-w-0">
            <span className="block text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Previous</span>
            <span className="block truncate text-sm font-medium">{previous.title}</span>
          </span>
        </Link>
      ) : (
        <span aria-hidden />
      )}
      {next && (
        <Link
          href={docHref(next.slug)}
          className="group flex items-center justify-end gap-3 rounded-card border border-border px-4 py-3 text-right transition-colors hover:bg-muted"
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Next</span>
            <span className="block truncate text-sm font-medium">{next.title}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
