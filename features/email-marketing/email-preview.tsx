"use client";

import { useState } from "react";
import { ImageIcon, Info, Monitor, Moon, Ruler, Smartphone, Sun, UserRound } from "lucide-react";

import { adviceIcon, pickFallback } from "@/lib/email-blocks";
import { formatMoney } from "@/lib/email-marketing";
import { cn } from "@/lib/utils";
import type { AdviceBlock, CampaignMessage, CatalogProduct, ContentBlock } from "@/types/email-marketing";

type Device = "desktop" | "mobile";
type Theme = "light" | "dark";

const FIT_ADVICE: Record<NonNullable<CatalogProduct["fit"]>, string> = {
  true_to_size: "Fits true to size.",
  runs_small: "Runs small — most customers go one size up.",
  runs_large: "Runs large — most customers go one size down.",
};

function Block({ block, catalog, advice }: { block: ContentBlock; catalog: CatalogProduct[]; advice?: AdviceBlock }) {
  switch (block.kind) {
    case "hero":
      return (
        <div className="space-y-3">
          <div className="grid aspect-[2/1] place-items-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
            <ImageIcon className="size-6" />
          </div>
          <h3 className="font-heading text-xl tracking-wide">{block.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>
          <span className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Shop now</span>
        </div>
      );
    case "product_grid": {
      const products = catalog.filter((p) => block.productIds?.includes(p.id));
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{block.title}</p>
          <div className="grid grid-cols-2 gap-2 @[420px]:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="grid aspect-square place-items-center rounded-md bg-muted text-muted-foreground" aria-hidden>
                  <ImageIcon className="size-4" />
                </div>
                <p className="text-xs font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{formatMoney(p.price)}</p>
                {p.fit && p.fit !== "true_to_size" ? <p className="text-[10px] text-muted-foreground">{FIT_ADVICE[p.fit]}</p> : null}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "picked_for_you": {
      // SPEC-368: the preview shows the fallback — what a test send and anyone without a pick get.
      const fallback = catalog.find((p) => p.id === pickFallback(block));
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{block.title}</p>
          {block.body ? <p className="text-sm text-muted-foreground">{block.body}</p> : null}
          {fallback ? (
            <div className="flex gap-3 rounded-lg border border-border p-2">
              <div className="grid size-20 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground" aria-hidden>
                <ImageIcon className="size-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">{fallback.title}</p>
                <p className="text-xs text-muted-foreground">{formatMoney(fallback.price)}</p>
                <span className="inline-block rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Shop now</span>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">No fallback product chosen yet.</p>
          )}
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <UserRound className="size-3.5 shrink-0" aria-hidden />
            Each customer sees their own pick; this is the fallback.
          </p>
        </div>
      );
    }
    case "size_advice": {
      // SPEC-364: a ruler for a clothing store only; any other trade gets a neutral info mark.
      const Icon = adviceIcon(advice) === "ruler" ? Ruler : Info;
      return (
        <div className="flex gap-2 rounded-lg border border-border p-3 text-sm">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">{block.title}</p>
            <p className="text-muted-foreground">{block.body}</p>
          </div>
        </div>
      );
    }
    case "blog_teaser":
      return (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{block.title}</p>
          <p className="mt-1 text-sm font-medium">{block.body}</p>
          <p className="mt-1 text-xs text-primary underline">Read the post</p>
        </div>
      );
    case "ugc":
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{block.title}</p>
          <div className="grid grid-cols-3 gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-square rounded-md bg-muted" />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{block.body}</p>
        </div>
      );
    case "text":
      return <p className="text-sm leading-relaxed">{block.body}</p>;
    case "footer":
      return <p className="border-t border-border pt-3 text-center text-[11px] text-muted-foreground">{block.body}</p>;
  }
}

function Toggle<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; icon: typeof Sun }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <option.icon className="size-3.5" aria-hidden />
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * The email as a customer sees it (SPEC-345): the inbox line, then the blocks, on desktop
 * or mobile, in a light or dark mail client — the four views the pre-send panel requires.
 * The backend's render (`POST /content/render`) replaces this drawing with the real HTML.
 * SPEC-364: the advice block's mark follows the store's trade (`advice`).
 */
export function EmailPreview({
  message,
  catalog,
  fromName,
  advice,
}: {
  message: CampaignMessage;
  catalog: CatalogProduct[];
  fromName: string;
  /** The store's advice block (`content.adviceBlock`), which says the store's trade. */
  advice?: AdviceBlock;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Toggle
          label="Device"
          value={device}
          onChange={setDevice}
          options={[
            { value: "desktop", label: "Desktop", icon: Monitor },
            { value: "mobile", label: "Mobile", icon: Smartphone },
          ]}
        />
        <Toggle
          label="Mail client theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
          ]}
        />
      </div>
      <div className={cn(theme, "rounded-2xl border border-border bg-muted/40 p-3")}>
        <div
          className={cn("@container mx-auto overflow-hidden rounded-xl border border-border bg-background text-foreground", device === "desktop" ? "max-w-[600px]" : "max-w-[360px]")}
          aria-label={`Email preview, ${device}, ${theme} mode`}
        >
          <div className="border-b border-border bg-card px-4 py-2.5">
            <p className="truncate text-xs font-semibold">{fromName}</p>
            <p className="truncate text-sm font-medium">{message.subject || "No subject yet"}</p>
            <p className="truncate text-xs text-muted-foreground">{message.previewText || "No preview text yet"}</p>
          </div>
          <div className="space-y-5 p-4">
            {message.blocks.map((block) => (
              <Block key={block.id} block={block} catalog={catalog} advice={advice} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
