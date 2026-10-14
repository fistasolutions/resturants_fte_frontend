"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  categoryLabel,
  DEFAULT_CATEGORY,
  pageInfo,
  pageWindow,
  searchApplies,
  STUDIO_PAGE_SIZE,
} from "@/lib/social-catalog";
import { fetchSocialProducts } from "@/services/social-actions";
import type {
  SocialCategory,
  StudioProduct,
  StudioProductsPage,
} from "@/types/social";
import { formatNumber } from "@/utils/format";

import { ProductThumb } from "./product-thumb";
import { ReasonChip } from "./social-pills";
import { GlispIcon } from "@/components/shared/glisp-icon";

const SEARCH_DEBOUNCE_MS = 250;

/** One product tile in the grid — the whole card is a single button so it is
 * click- and keyboard-operable. The suggested product carries a primary border
 * plus a corner pill. */
function ProductCard({
  product,
  onSelect,
}: {
  product: StudioProduct;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border bg-card text-left transition-colors outline-none hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        product.suggested ? "border-primary" : "border-border",
      )}
    >
      <div className="relative">
        <ProductThumb
          name={product.name}
          imageUrl={product.imageUrl}
          className="aspect-[4/5] w-full rounded-none border-0 border-b border-border"
        />
        {product.suggested && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-4xl bg-primary px-2 py-0.5 text-[0.625rem] font-medium text-primary-foreground shadow-sm">
            <GlispIcon className="size-2.5" aria-hidden />
            Suggested
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {product.category} · {product.priceLabel}
        </p>
        <div>
          <ReasonChip reason={product.reason} />
        </div>
        {product.reasonDetail && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.reasonDetail}
          </p>
        )}
      </div>
    </button>
  );
}

const GRID_CLASS = "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4";

/**
 * Content Studio right area, default mode (SPEC-135): a responsive product grid
 * for the selected category, with full-catalog search (`all` only) and offset
 * pagination. Category / search / page changes update local state + a client
 * fetch only — never a navigation or full-page reload. The component is keyed
 * on `category` upstream, so switching category remounts just this subtree with
 * fresh state; page and search changes stay in-component.
 *
 * The default `recommended` first page is SSR-seeded (`initial`) and rendered
 * with no fetch on first mount; every other category/search/page fetches.
 */
export function StudioProductBrowser({
  category,
  initial,
  onSelectProduct,
}: {
  category: SocialCategory;
  initial: StudioProductsPage;
  onSelectProduct: (product: StudioProduct) => void;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [offset, setOffset] = useState(0);
  const [products, setProducts] = useState<StudioProduct[]>(initial.products);
  const [total, setTotal] = useState(initial.total);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  // The recommended first page arrives from SSR; skip refetching it on mount.
  const seeded = useRef(true);

  // Debounce the search box (only meaningful for `all`); a new term resets to
  // page 1 in the same batched update so the fetch effect fires once.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setOffset(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (seeded.current) {
      seeded.current = false;
      // Only the default recommended first page is SSR-seeded — everything else
      // (a non-default category remount, any search, any page) fetches.
      if (category === DEFAULT_CATEGORY && offset === 0 && !debounced) return;
    }
    let active = true;
    setStatus("loading");
    const query = searchApplies(category) ? debounced : undefined;
    fetchSocialProducts(category, query, STUDIO_PAGE_SIZE, offset)
      .then((res) => {
        if (!active) return;
        setProducts(res.products);
        setTotal(res.total);
        setStatus("idle");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [category, debounced, offset]);

  const loading = status === "loading";
  const showSearch = searchApplies(category);
  const info = pageInfo(total, STUDIO_PAGE_SIZE, offset);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">
            {categoryLabel(category)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {showSearch
              ? "Search the full catalog, then pick a product to draft content."
              : "Pick a product to draft native-ready Instagram and Facebook content — grounded in your Shopify data."}
          </p>
        </div>
        {showSearch && (
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the full catalog…"
              aria-label="Search the full catalog"
              className="h-9 pl-8"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className={GRID_CLASS} aria-hidden>
          {Array.from({ length: STUDIO_PAGE_SIZE }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-card" />
          ))}
        </div>
      ) : status === "error" ? (
        <p role="alert" className="py-12 text-center text-sm text-muted-foreground">
          We couldn&apos;t load these products. Pick another category or try again.
        </p>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {showSearch && debounced
            ? "No products match that search."
            : "No products in this signal right now."}
        </p>
      ) : (
        <div className={GRID_CLASS}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={() => onSelectProduct(product)}
            />
          ))}
        </div>
      )}

      {!loading && status !== "error" && products.length > 0 && info.pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing {formatNumber(info.from)}–{formatNumber(info.to)} of{" "}
            {formatNumber(info.total)}
          </p>
          <nav aria-label="Product pages" className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={!info.hasPrev}
              onClick={() => setOffset((prev) => Math.max(0, prev - STUDIO_PAGE_SIZE))}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            {pageWindow(info.page, info.pageCount).map((p) => {
              const current = p === info.page;
              return (
                <Button
                  key={p}
                  variant={current ? "default" : "outline"}
                  size="icon-sm"
                  aria-label={`Page ${p}`}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOffset((p - 1) * STUDIO_PAGE_SIZE)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={!info.hasNext}
              onClick={() => setOffset((prev) => prev + STUDIO_PAGE_SIZE)}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
