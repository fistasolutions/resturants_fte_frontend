"use client";

import { useEffect, useState } from "react";
import { Camera, Check, Loader2, Plus, Search, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { STUDIO_PAGE_SIZE } from "@/lib/social-catalog";
import type { AddSlotChannel } from "@/lib/social-plan";
import { fetchSocialProducts } from "@/services/social-actions";
import type { StudioProduct } from "@/types/social";
import { formatDate } from "@/utils/format";

import { ProductThumb } from "./product-thumb";

const SEARCH_DEBOUNCE_MS = 250;

// This lucide version ships no brand icons; the repo's convention (social-pills)
// stands in Camera for Instagram and ThumbsUp for Facebook — neutral glyphs, per
// Rule 9 (platform identity is name + icon, never a brand color).
const CHANNEL_OPTIONS: { id: AddSlotChannel; label: string; Icon: typeof Camera }[] = [
  { id: "instagram", label: "Instagram", Icon: Camera },
  { id: "facebook", label: "Facebook", Icon: ThumbsUp },
];

/* ── Instagram / Facebook picker ─────────────────────────────────────────── */

function ChannelPicker({
  value,
  onChange,
  disabled,
}: {
  value: AddSlotChannel;
  onChange: (value: AddSlotChannel) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Channel"
      className="inline-flex gap-1 rounded-lg border border-border bg-muted/40 p-1"
    >
      {CHANNEL_OPTIONS.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── One selectable product row ──────────────────────────────────────────── */

function ProductRow({
  product,
  selected,
  onSelect,
}: {
  product: StudioProduct;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
      )}
    >
      <ProductThumb
        name={product.name}
        imageUrl={product.imageUrl}
        className="size-11 shrink-0 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {product.category} · {product.priceLabel}
        </p>
      </div>
      {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
    </button>
  );
}

/* ── The picker body (mounts fresh each time the dialog opens) ────────────── */

/**
 * The stateful picker. Rendered only while the dialog is open (Radix portals its
 * content on open), so it mounts fresh each time — no reset effect needed. Owns
 * the search + selection + local loading/empty/error; the parent's `onAdd`
 * performs the `addPlanSlot` call + board merge and closes the dialog on success.
 */
function AddSlotForm({
  onAdd,
}: {
  onAdd: (productId: string, channel: AddSlotChannel) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [products, setProducts] = useState<StudioProduct[] | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [selected, setSelected] = useState<StudioProduct | null>(null);
  const [channel, setChannel] = useState<AddSlotChannel>("instagram");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Debounce the search box.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch the (searched) full catalog. `status` starts "loading" so the first
  // paint is the skeleton with no synchronous setState; refetches on a new search
  // term re-enter loading inside the debounced update below.
  useEffect(() => {
    let active = true;
    fetchSocialProducts("all", debounced, STUDIO_PAGE_SIZE, 0)
      .then((res) => {
        if (!active) return;
        setProducts(res.products);
        setStatus("idle");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [debounced]);

  function onSearchChange(value: string) {
    setSearch(value);
    setStatus("loading");
  }

  async function submit() {
    if (!selected || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      await onAdd(selected.id, channel);
      // The parent closes the dialog on success.
    } catch (error) {
      setAddError(
        error instanceof Error
          ? error.message
          : "Couldn't add this post. Please try again.",
      );
      setAdding(false);
    }
  }

  const loading = status === "loading";

  return (
    <>
      <div className="space-y-3">
        <ChannelPicker value={channel} onChange={setChannel} disabled={adding} />

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-9 pl-8"
            disabled={adding}
            autoFocus
          />
        </div>

        <div
          role="listbox"
          aria-label="Products"
          className="scrollbar-subtle max-h-64 space-y-2 overflow-y-auto pr-1"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[3.75rem] w-full rounded-lg" />
            ))
          ) : status === "error" ? (
            <p role="alert" className="py-8 text-center text-sm text-muted-foreground">
              We couldn&apos;t load products. Please try again.
            </p>
          ) : products && products.length > 0 ? (
            products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                selected={selected?.id === product.id}
                onSelect={() => setSelected(product)}
              />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {debounced ? "No products match that search." : "No products available."}
            </p>
          )}
        </div>

        {addError && (
          <p role="alert" className="text-sm text-destructive">
            {addError}
          </p>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={adding}>
            Cancel
          </Button>
        </DialogClose>
        <Button onClick={submit} disabled={!selected || adding}>
          {adding ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Adding…
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden />
              Add post
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

/* ── The dialog shell ────────────────────────────────────────────────────── */

/**
 * Compact "add a post to this day" picker (SPEC-142). The stateful body
 * (`AddSlotForm`) mounts only while open, so each open starts clean.
 */
export function AddSlotDialog({
  open,
  onOpenChange,
  dateISO,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Bare "YYYY-MM-DD" day the new slot is added to. */
  dateISO: string;
  /** Add the chosen product/channel; rejects on failure so the error can show. */
  onAdd: (productId: string, channel: AddSlotChannel) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a post</DialogTitle>
          <DialogDescription>
            {dateISO
              ? `Pick a product to post on ${formatDate(dateISO)}.`
              : "Pick a product for this day."}
          </DialogDescription>
        </DialogHeader>
        {open && <AddSlotForm onAdd={onAdd} />}
      </DialogContent>
    </Dialog>
  );
}
