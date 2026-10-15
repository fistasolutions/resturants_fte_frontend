"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { BranchPicker, useBranchChoice } from "@/features/restaurant-os/branch-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { setBranchAvailability, setBranchPrices, type OverrideChange } from "@/services/restaurant-os-actions";

function PriceInput({ value, disabled, label, onSave }: { value: number; disabled: boolean; label: string; onSave: (price: number) => void }) {
  const [text, setText] = useState(String(value));
  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const price = Number(text);
        if (Number.isFinite(price) && price >= 0 && price !== value) onSave(price);
      }}
      disabled={disabled}
      aria-label={label}
      inputMode="decimal"
      className="h-8 w-24 text-right tabular-nums"
    />
  );
}

/** Menu › Branch menu (SPEC-379 over backend SPEC-392): one branch's prices and what it has run
 * out of (86). Prices need `menu.manage`; availability needs `kitchen.operate`. */
export function BranchMenuTab() {
  const queryClient = useQueryClient();
  const can = useCan();
  const { branches, branch, loading, error: branchError } = useBranchChoice();
  const menu = useApiQuery(branch ? restaurantQueries.branchMenu(branch.id) : null);
  const [error, setError] = useState<string | null>(null);
  const canPrice = can(["menu.manage"]).allowed;
  const canAvail = can(["kitchen.operate"]).allowed;
  if (branchError) return <QueryErrorState error={branchError} onRetry={() => window.location.reload()} />;
  if (loading) return <RestaurantSkeleton tiles={0} />;
  if (!branch) return <EmptyPanel title="No branch" body="Your access covers no open branch." />;

  const run = async (work: () => Promise<unknown>) => {
    setError(null);
    try {
      await work();
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "branch-menu", branch.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    }
  };
  const price = (change: OverrideChange) => run(() => setBranchPrices(branch.id, [change]));
  const avail = (change: OverrideChange) => run(() => setBranchAvailability(branch.id, [change]));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BranchPicker branches={branches} branch={branch} />
        <p className="text-xs text-muted-foreground">Change a price and leave the box to save it. Switch off what has run out (86) — it disappears from the POS and the online menu at once.</p>
      </div>
      <FormError message={error} />
      {menu.isError ? (
        <QueryErrorState error={menu.error} onRetry={() => void menu.refetch()} />
      ) : !menu.data ? (
        <RestaurantSkeleton tiles={0} />
      ) : menu.data.sections.length === 0 ? (
        <EmptyPanel title="No menu yet" body="Head office builds the menu on Menu › Catalog." />
      ) : (
        menu.data.sections.map((section) => (
          <section key={section.name} className="overflow-hidden rounded-2xl border border-border bg-card">
            <h2 className="border-b border-border px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{section.name}</h2>
            <ul className="divide-y divide-border">
              {section.items.map((item) => (
                <li key={item.id} className="space-y-2 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <div className="flex items-center gap-3">
                      {item.sizes.length === 0 ? (
                        <PriceInput value={item.price} disabled={!canPrice} label={`${item.name} price`} onSave={(p) => void price({ target: "item", targetId: item.id, price: p })} />
                      ) : null}
                      <Switch checked={item.available} disabled={!canAvail} aria-label={`${item.name} available`} onCheckedChange={(on) => void avail({ target: "item", targetId: item.id, available: on })} />
                    </div>
                  </div>
                  {item.sizes.length ? (
                    <div className="flex flex-wrap gap-3">
                      {item.sizes.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          {s.name}
                          <PriceInput value={s.price} disabled={!canPrice} label={`${s.name} ${item.name} price`} onSave={(p) => void price({ target: "size", targetId: s.id, price: p })} />
                          <Switch checked={s.available} disabled={!canAvail} aria-label={`${s.name} ${item.name} available`} onCheckedChange={(on) => void avail({ target: "size", targetId: s.id, available: on })} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {item.groups.flatMap((g) => g.options).length ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Toppings and choices</summary>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {item.groups.flatMap((g) =>
                          g.options.map((o) => (
                            <label key={`${g.id}-${o.id}`} className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1">
                              <span>
                                {o.name} <span className="text-muted-foreground">· {g.name}</span>
                              </span>
                              <Switch checked={o.available} disabled={!canAvail} aria-label={`${o.name} available`} onCheckedChange={(on) => void avail({ target: "option", targetId: o.id, available: on })} />
                            </label>
                          )),
                        )}
                      </div>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
