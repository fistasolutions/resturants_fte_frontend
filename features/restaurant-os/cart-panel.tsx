"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CartLineInput, PricedCart } from "@/types/restaurant-os";
import { formatCurrency } from "@/utils/format";

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between text-base font-bold text-foreground" : "flex justify-between text-sm text-muted-foreground"}>
      <span>{label}</span>
      <span className="tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

/** The order being built and the backend's price for it (SPEC-379). */
export function CartPanel({
  lines,
  priced,
  pricing,
  onQuantity,
  onRemove,
}: {
  lines: CartLineInput[];
  priced: PricedCart | null;
  pricing: boolean;
  onQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
}) {
  if (lines.length === 0) {
    return <p className="px-1 py-8 text-center text-sm text-muted-foreground">Nothing in the order yet.</p>;
  }
  const lineErrors = new Map<number, string[]>();
  for (const error of priced?.errors ?? []) {
    if (error.line == null) continue;
    lineErrors.set(error.line, [...(lineErrors.get(error.line) ?? []), error.message]);
  }
  const orderErrors = (priced?.errors ?? []).filter((e) => e.line == null);
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border">
        {lines.map((line, index) => {
          const price = priced && priced.errors.length === 0 ? priced.lines[index] : undefined;
          return (
            <li key={line.key} className="py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{line.label}</p>
                  {line.detail ? <p className="text-xs text-muted-foreground">{line.detail}</p> : null}
                  {line.note ? <p className="text-xs italic text-muted-foreground">“{line.note}”</p> : null}
                  {lineErrors.get(index)?.map((m) => (
                    <p key={m} className="text-xs text-destructive">
                      {m}
                    </p>
                  ))}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-foreground">{price ? formatCurrency(price.lineTotal) : "…"}</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <Button size="icon" variant="ghost" className="size-7" aria-label={`One fewer ${line.label}`} onClick={() => onQuantity(line.key, Math.max(1, line.quantity - 1))}>
                  <Minus aria-hidden />
                </Button>
                <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                <Button size="icon" variant="ghost" className="size-7" aria-label={`One more ${line.label}`} onClick={() => onQuantity(line.key, Math.min(99, line.quantity + 1))}>
                  <Plus aria-hidden />
                </Button>
                <Button size="icon" variant="ghost" className="ml-auto size-7" aria-label={`Remove ${line.label}`} onClick={() => onRemove(line.key)}>
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {orderErrors.map((e) => (
        <p key={e.message} role="alert" className="text-sm text-destructive">
          {e.message}
        </p>
      ))}
      {priced && priced.errors.length === 0 ? (
        <div className="space-y-1 border-t border-border pt-2" aria-busy={pricing}>
          <Row label="Subtotal" value={priced.subtotal} />
          {priced.discount > 0 ? <Row label={priced.deal ? priced.deal.name : "Discount"} value={-priced.discount} /> : null}
          {priced.deal && priced.discount === 0 ? <p className="text-xs text-success">{priced.deal.name} applied</p> : null}
          {priced.deliveryFee > 0 ? <Row label="Delivery" value={priced.deliveryFee} /> : null}
          <Row label="Tax" value={priced.tax} />
          {priced.tip > 0 ? <Row label="Tip" value={priced.tip} /> : null}
          <Row label="Total" value={priced.total} strong />
        </div>
      ) : pricing ? (
        <p className="text-xs text-muted-foreground">Pricing…</p>
      ) : null}
    </div>
  );
}
