"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductPicker } from "@/features/email-marketing/product-picker";
import type { BuilderDraft } from "@/lib/email-builder";
import { marginAfterDiscount } from "@/lib/email-marketing";
import { cn } from "@/lib/utils";
import type { CatalogProduct, DiscountCode, Guardrails, OfferKind } from "@/types/email-marketing";

const OFFERS: { kind: OfferKind; label: string; detail: string }[] = [
  { kind: "none", label: "No offer", detail: "Often the most profitable choice — most buyers would have paid full price." },
  { kind: "discount", label: "Discount code", detail: "One of your Shopify codes, for everyone in the send." },
  { kind: "free_shipping", label: "Free shipping", detail: "A Shopify free-shipping code — costs the shipping, not the margin on every item." },
];

/** How a code reads in the picker: its value and, when it has one, when it ends. */
function codeLabel(code: DiscountCode): string {
  const value = code.percent !== null ? `${code.percent}% off` : `${code.value} off`;
  return code.endsAt ? `${code.code} · ${value} · ends ${new Date(code.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : `${code.code} · ${value}`;
}

/** Step 3 — the offer and the products, priced against margin first. A code is one the store
 * already has in Shopify (ftes reads Shopify and never creates one, so unique per-customer codes
 * are not offered). A discount that takes a product under the margin floor is shown in red and
 * blocks the send at review. */
export function StepOffer({
  draft,
  catalog,
  guardrails,
  codes,
  onChange,
}: {
  draft: BuilderDraft;
  catalog: CatalogProduct[];
  guardrails: Guardrails;
  codes: readonly DiscountCode[];
  onChange: (patch: Partial<Pick<BuilderDraft, "offerKind" | "discountCode" | "discountPercent" | "productIds">>) => void;
}) {
  const discounting = draft.offerKind === "discount" && draft.discountPercent > 0;
  const needsCode = draft.offerKind === "discount" || draft.offerKind === "free_shipping";
  const picked = catalog.filter((p) => draft.productIds.includes(p.id));
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Offer</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {OFFERS.map((o) => (
            <label key={o.kind} className={cn("flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors", draft.offerKind === o.kind ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50")}>
              <input type="radio" name="offer" className="mt-1 accent-primary" checked={draft.offerKind === o.kind} onChange={() => onChange({ offerKind: o.kind, discountCode: null, discountPercent: 0 })} />
              <span>
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {needsCode ? (
        <div className="max-w-md space-y-1.5">
          <Label htmlFor="discount-code">Shopify code</Label>
          {codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active codes in Shopify. Create one there and it appears here after the next sync — or choose no offer.</p>
          ) : (
            <Select
              value={draft.discountCode ?? ""}
              onValueChange={(value) => {
                const code = codes.find((c) => c.code === value);
                onChange({ discountCode: code?.code ?? null, discountPercent: code?.percent ?? 0 });
              }}
            >
              <SelectTrigger id="discount-code" className="w-full">
                <SelectValue placeholder="Pick a code" />
              </SelectTrigger>
              <SelectContent>
                {codes.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {codeLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {draft.discountPercent > 0 ? (
            <p className={cn("text-xs", draft.discountPercent > guardrails.maxDiscountPercent ? "text-destructive" : "text-muted-foreground")}>
              {draft.discountPercent}% off. Your limit is {guardrails.maxDiscountPercent}%.
            </p>
          ) : null}
        </div>
      ) : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Products to feature</legend>
        <ProductPicker catalog={catalog} selected={draft.productIds} onChange={(ids) => onChange({ productIds: ids })} />
      </fieldset>
      {discounting && picked.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <p className="border-b border-border px-3 py-2 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">Margin after {draft.discountPercent}% off</p>
          <ul className="divide-y divide-border text-sm">
            {picked.map((p) => {
              const left = marginAfterDiscount(p.marginPercent, draft.discountPercent);
              const under = left < guardrails.marginFloorPercent;
              return (
                <li key={p.id} className="flex justify-between gap-3 px-3 py-2">
                  <span>{p.title}</span>
                  <span className={cn("tabular-nums", under ? "font-semibold text-destructive" : "text-foreground")}>
                    {p.marginPercent}% → {Math.round(left)}%{under ? ` · under your ${guardrails.marginFloorPercent}% floor` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
