import Link from "next/link";

import type { RunPage } from "@/types/system";

/**
 * Server-side pagination (SPEC-228).
 *
 * Plain links rather than buttons, so the page is shareable, back works, and it
 * functions before hydration — this is a table of records, not an app surface.
 */
export function RunPager({
  page,
  basePath,
  params,
}: {
  page: RunPage;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (page.pages <= 1) return null;

  const href = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
    }
    next.set("page", String(target));
    return `${basePath}?${next.toString()}`;
  };

  const link =
    "inline-flex h-9 items-center rounded-[10px] border border-border px-3 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring outline-none";
  const disabled =
    "inline-flex h-9 items-center rounded-[10px] border border-border px-3 text-sm text-muted-foreground opacity-50";

  const first = (page.page - 1) * page.pageSize + 1;
  const last = Math.min(page.page * page.pageSize, page.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground tabular-nums">
        {first}–{last} of {page.total} runs
      </p>
      <div className="flex items-center gap-2">
        {page.page > 1 ? (
          <Link href={href(page.page - 1)} className={link} rel="prev">
            Previous
          </Link>
        ) : (
          <span className={disabled} aria-disabled>
            Previous
          </span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">
          Page {page.page} of {page.pages}
        </span>
        {page.page < page.pages ? (
          <Link href={href(page.page + 1)} className={link} rel="next">
            Next
          </Link>
        ) : (
          <span className={disabled} aria-disabled>
            Next
          </span>
        )}
      </div>
    </div>
  );
}
