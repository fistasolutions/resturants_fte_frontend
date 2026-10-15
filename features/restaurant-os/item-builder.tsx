"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AMOUNT_LABELS,
  builderDefaults,
  builderProblems,
  cartLine,
  setSelection,
  toggleSelection,
  type Selection,
} from "@/lib/restaurant-os";
import { cn } from "@/lib/utils";
import type { Amount, CartLineInput, MenuEntry, MenuGroup, Portion } from "@/types/restaurant-os";
import { formatCurrency } from "@/utils/format";

const PORTION_SHORT: Record<Portion, string> = { left: "Left", whole: "Whole", right: "Right" };

function Segment<T extends string>({
  value,
  options,
  labels,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="flex rounded-md border border-border p-0.5" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

function GroupPicker({
  group,
  sizeName,
  selections,
  onToggle,
  onChange,
}: {
  group: MenuGroup;
  sizeName: string | null;
  selections: Selection[];
  onToggle: (optionId: number) => void;
  onChange: (optionId: number, change: Partial<Selection>) => void;
}) {
  const rule =
    group.maxSelect === 1
      ? group.minSelect >= 1
        ? "Choose one"
        : "Optional, one"
      : `${group.minSelect ? `At least ${group.minSelect}` : "Optional"}${group.maxSelect != null ? `, up to ${group.maxSelect}` : ""}${group.freeQuantity ? ` · ${group.freeQuantity} included` : ""}`;
  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-baseline justify-between text-sm font-semibold text-foreground">
        {group.name}
        <span className="text-xs font-normal text-muted-foreground">{rule}</span>
      </legend>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {group.options.map((option) => {
          const selected = selections.find((s) => s.optionId === option.id);
          const price = sizeName && option.sizePrices[sizeName] != null ? option.sizePrices[sizeName] : option.price;
          return (
            <div
              key={option.id}
              className={cn(
                "rounded-lg border px-2.5 py-2 transition-colors",
                selected ? "border-foreground/40 bg-muted/50" : "border-border",
                !option.available && "opacity-50",
              )}
            >
              <button
                type="button"
                disabled={!option.available}
                onClick={() => onToggle(option.id)}
                aria-pressed={Boolean(selected)}
                className="flex w-full items-center justify-between gap-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium text-foreground">
                  {option.name}
                  {option.isDefault ? <span className="ml-1 text-xs text-muted-foreground">(included)</span> : null}
                  {!option.available ? <span className="ml-1 text-xs text-muted-foreground">(out)</span> : null}
                </span>
                {option.isDefault ? (
                  price > 0 && group.allowAmounts ? (
                    <span className="text-xs tabular-nums text-muted-foreground">extra +{formatCurrency(price)}</span>
                  ) : null
                ) : price > 0 ? (
                  <span className="text-xs tabular-nums text-muted-foreground">+{formatCurrency(price)}</span>
                ) : null}
              </button>
              {selected && (group.allowHalves || group.allowAmounts) ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {group.allowHalves ? (
                    <Segment<Portion>
                      label={`${option.name} portion`}
                      value={selected.portion}
                      options={["left", "whole", "right"]}
                      labels={PORTION_SHORT}
                      onChange={(portion) => onChange(option.id, { portion })}
                    />
                  ) : null}
                  {group.allowAmounts ? (
                    <Segment<Amount>
                      label={`${option.name} amount`}
                      value={selected.amount}
                      options={["light", "regular", "extra"]}
                      labels={AMOUNT_LABELS}
                      onChange={(amount) => onChange(option.id, { amount })}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The item builder (SPEC-379): size, toppings by whole or half and light/regular/extra, choices,
 * quantity and a note. It builds a cart line; the backend prices it.
 */
export function ItemBuilder({ item, onClose, onAdd }: { item: MenuEntry; onClose: () => void; onAdd: (line: CartLineInput) => void }) {
  const [start] = useState(() => builderDefaults(item));
  const [sizeId, setSizeId] = useState<number | null>(start.sizeId);
  const [selections, setSelections] = useState<Selection[]>(start.selections);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const size = item.sizes.find((s) => s.id === sizeId) ?? null;
  const problems = builderProblems(item, sizeId, selections);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.category}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {item.sizes.length ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-foreground">Size</legend>
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!s.available}
                    aria-pressed={s.id === sizeId}
                    onClick={() => setSizeId(s.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                      s.id === sizeId ? "border-foreground/40 bg-muted font-semibold" : "border-border",
                    )}
                  >
                    {s.name} <span className="tabular-nums text-muted-foreground">{formatCurrency(s.price)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
          {item.groups.map((group) => (
            <GroupPicker
              key={group.id}
              group={group}
              sizeName={size?.name ?? null}
              selections={selections}
              onToggle={(id) => setSelections((cur) => toggleSelection(item, cur, id))}
              onChange={(id, change) => setSelections((cur) => setSelection(cur, id, change))}
            />
          ))}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <div className="flex items-center gap-1">
                <Button type="button" size="icon" variant="outline" aria-label="One fewer" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus aria-hidden />
                </Button>
                <span className="w-8 text-center tabular-nums">{quantity}</span>
                <Button type="button" size="icon" variant="outline" aria-label="One more" onClick={() => setQuantity((q) => Math.min(99, q + 1))}>
                  <Plus aria-hidden />
                </Button>
              </div>
            </div>
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="line-note">Note</Label>
              <Input id="line-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Well done, cut in squares…" />
            </div>
          </div>
        </div>
        {problems.length ? <p className="text-sm text-muted-foreground">{problems.join(" ")}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={problems.length > 0}
            onClick={() => {
              onAdd(cartLine(item, sizeId, selections, quantity, note));
              onClose();
            }}
          >
            Add to order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
