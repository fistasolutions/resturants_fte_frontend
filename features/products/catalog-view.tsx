"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CatalogTable } from "@/features/analysis/catalog-table";
import type { VerdictState } from "@/features/products/catalog-verdict-cell";
import { CatalogGrid } from "@/features/products/catalog-grid";
import { CATALOG_PAGE_SIZE, pageCount, paginate } from "@/lib/catalog-pagination";
import { cn } from "@/lib/utils";
import type { CatalogRow, CatalogVerdicts } from "@/types/analysis";

type CatalogViewMode = "grid" | "row";

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface CatalogViewProps {
  rows: CatalogRow[];
  /** Range query string, e.g. "start=2026-06-01&end=2026-07-01" — appended to
   * the verdict fetch so it describes exactly the visible window. */
  query: string;
  /** Cached verdicts for the first page, pre-fetched server-side (SPEC-105) so
   * already-generated notes paint with no skeleton flash. */
  initialVerdicts?: CatalogVerdicts | null;
}

/** Catalog view switcher + client pagination (SPEC-093/105). The table renders
 * instantly; per-row AI verdicts are fetched on-demand for ONLY the visible
 * page and cached server-side — the only cell that ever shows a skeleton. */
export function CatalogView({ rows, query, initialVerdicts }: CatalogViewProps) {
  const [view, setView] = useState<CatalogViewMode>("grid");
  const [page, setPage] = useState(1);

  const [verdicts, setVerdicts] = useState<Map<number, string>>(() => {
    const seed = new Map<number, string>();
    for (const v of initialVerdicts?.verdicts ?? []) seed.set(v.product_id, v.verdict);
    return seed;
  });
  const [fetched, setFetched] = useState<Set<number>>(
    () => new Set((initialVerdicts?.verdicts ?? []).map((v) => v.product_id)),
  );
  // ids already requested (seeded from the cache-only pre-fetch) so a page is
  // never fetched twice and merges never re-trigger the effect.
  const requested = useRef<Set<number>>(
    new Set((initialVerdicts?.verdicts ?? []).map((v) => v.product_id)),
  );

  const total = rows.length;
  const pages = pageCount(total);
  const visible = useMemo(() => paginate(rows, page), [rows, page]);
  const visibleKey = visible.map((r) => r.product_id).join(",");

  useEffect(() => {
    const toFetch = visible
      .map((r) => r.product_id)
      .filter((id) => !requested.current.has(id));
    if (toFetch.length === 0) return;
    toFetch.forEach((id) => requested.current.add(id));

    let cancelled = false;
    const markFetched = () => {
      if (cancelled) return;
      setFetched((prev) => {
        const next = new Set(prev);
        toFetch.forEach((id) => next.add(id));
        return next;
      });
    };
    fetch(`/api/proxy/analysis/products/catalog-verdicts?${query}&ids=${toFetch.join(",")}`)
      .then((r) => (r.ok ? (r.json() as Promise<CatalogVerdicts>) : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.verdicts?.length) {
          setVerdicts((prev) => {
            const next = new Map(prev);
            for (const v of data.verdicts) next.set(v.product_id, v.verdict);
            return next;
          });
        }
        markFetched();
      })
      .catch(markFetched);
    return () => {
      cancelled = true;
    };
    // visibleKey captures the visible id set; query captures the range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey, query]);

  const verdictState: VerdictState = { verdicts, fetched };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <div
          role="group"
          aria-label="Catalog view"
          className="inline-flex rounded-lg border border-border p-0.5"
        >
          <ViewButton
            active={view === "grid"}
            onClick={() => setView("grid")}
            icon={<LayoutGrid className="size-4" />}
            label="Grid"
          />
          <ViewButton
            active={view === "row"}
            onClick={() => setView("row")}
            icon={<List className="size-4" />}
            label="Rows"
          />
        </div>
      </div>

      {view === "grid" ? (
        <CatalogGrid rows={visible} verdictState={verdictState} />
      ) : (
        <CatalogTable rows={visible} verdictState={verdictState} />
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Page {page} of {pages} · {total} products
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              aria-label="Next page"
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { CATALOG_PAGE_SIZE };
