"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ADDABLE_BLOCKS, blockLabel, newBlock, pickFallback } from "@/lib/email-blocks";
import type { AdviceBlock, ContentBlock } from "@/types/email-marketing";

/**
 * The email as a list of blocks (SPEC-345): reorder, edit, add, remove. The footer always
 * stays last and cannot be removed — it carries the unsubscribe link consent law requires.
 * Product grids pick from the real catalog (`productPicker`). The advice block is named for
 * the store's trade (`advice`, from its Brand Brain — SPEC-350). Picked for you (SPEC-368) has a
 * title, a body and one required fallback product, chosen with the same picker: the newest
 * product ticked replaces the last.
 */
export function BlockEditor({
  blocks,
  onChange,
  productPicker,
  advice,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  productPicker: (block: ContentBlock, update: (ids: number[]) => void) => React.ReactNode;
  advice?: AdviceBlock;
}) {
  const body = blocks.filter((b) => b.kind !== "footer");
  const footer = blocks.filter((b) => b.kind === "footer");
  const commit = (next: ContentBlock[]) => onChange([...next, ...footer]);
  const update = (id: string, patch: Partial<ContentBlock>) => commit(body.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const move = (index: number, step: -1 | 1) => {
    const next = [...body];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {body.map((block, index) => (
          <li key={block.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">{blockLabel(block.kind, advice)}</span>
              <div className="ml-auto flex gap-1">
                <Button type="button" size="icon-xs" variant="ghost" aria-label={`Move ${blockLabel(block.kind, advice)} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp aria-hidden />
                </Button>
                <Button type="button" size="icon-xs" variant="ghost" aria-label={`Move ${blockLabel(block.kind, advice)} down`} disabled={index === body.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown aria-hidden />
                </Button>
                <Button type="button" size="icon-xs" variant="ghost" aria-label={`Remove ${blockLabel(block.kind, advice)}`} onClick={() => commit(body.filter((b) => b.id !== block.id))}>
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </div>
            <Input aria-label={`${blockLabel(block.kind, advice)} title`} value={block.title} onChange={(event) => update(block.id, { title: event.target.value })} />
            {block.kind === "product_grid" ? (
              productPicker(block, (ids) => update(block.id, { productIds: ids }))
            ) : block.kind === "picked_for_you" ? (
              <div className="space-y-2">
                <Textarea aria-label={`${blockLabel(block.kind, advice)} text`} rows={2} value={block.body} onChange={(event) => update(block.id, { body: event.target.value })} />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Fallback product</p>
                  <p className="text-xs text-muted-foreground">
                    Each customer is shown a product picked from what they bought — in stock and above your margin floor. Anyone without a pick, and every test send, sees this one.
                  </p>
                  {pickFallback(block) === null ? (
                    <p className="text-xs text-warning" role="status">
                      Choose one product.
                    </p>
                  ) : null}
                </div>
                {productPicker(block, (ids) => update(block.id, { productIds: ids.slice(-1) }))}
              </div>
            ) : (
              <Textarea aria-label={`${blockLabel(block.kind, advice)} text`} rows={2} value={block.body} onChange={(event) => update(block.id, { body: event.target.value })} />
            )}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Add</span>
        {ADDABLE_BLOCKS.map((kind) => (
          <Button
            key={kind}
            type="button"
            size="xs"
            variant="outline"
            onClick={() => commit([...body, newBlock(kind, `${kind}-${body.length}-${blocks.length}-${Math.random().toString(36).slice(2, 7)}`, advice)])}
          >
            <Plus aria-hidden />
            {blockLabel(kind, advice)}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">The footer with the unsubscribe link always comes last.</p>
    </div>
  );
}
