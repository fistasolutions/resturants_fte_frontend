"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/features/restaurant/parts";
import { RESTAURANT_KEY } from "@/lib/queries/restaurant";
import {
  createGroup,
  createItem,
  setGroupOptions,
  setItemGroups,
  setItemSizes,
  updateGroup,
  updateItem,
} from "@/services/restaurant-os-actions";
import type { Catalog, CatalogGroup, CatalogItem, ItemKind } from "@/types/restaurant-os";

const NONE = "none";

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function optNum(value: string): number | null {
  return value.trim() === "" ? null : num(value);
}

function useSaver(onDone: () => void) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, save };
}

/** Add or edit a menu item: its details, sizes and the choice groups it offers. */
export function ItemDialog({ catalog, item, onClose }: { catalog: Catalog; item: CatalogItem | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId != null ? String(item.categoryId) : NONE);
  const [kind, setKind] = useState<ItemKind>(item?.kind ?? "simple");
  const [price, setPrice] = useState(String(item?.price ?? 0));
  const [foodCost, setFoodCost] = useState(item?.foodCost != null ? String(item.foodCost) : "");
  const [active, setActive] = useState(item?.isActive ?? true);
  const [sizes, setSizes] = useState(
    (item?.sizes ?? []).map((s) => ({ id: s.id as number | null, name: s.name, price: String(s.price), foodCost: s.foodCost != null ? String(s.foodCost) : "" })),
  );
  const [groups, setGroups] = useState<number[]>(item?.groupIds ?? []);
  const { busy, error, save } = useSaver(onClose);

  const submit = () =>
    save(async () => {
      const details = {
        name: name.trim(),
        description: description.trim() || null,
        categoryId: categoryId === NONE ? null : Number(categoryId),
        kind,
        price: num(price),
        foodCost: optNum(foodCost),
        isActive: active,
      };
      const saved = item ? await updateItem(item.id, details) : await createItem(details);
      await setItemSizes(
        saved.id,
        sizes.filter((s) => s.name.trim()).map((s) => ({ id: s.id, name: s.name.trim(), price: num(s.price), foodCost: optNum(s.foodCost) })),
      );
      await setItemGroups(saved.id, groups);
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? `Edit ${item.name}` : "Add a menu item"}</DialogTitle>
          <DialogDescription>Sizes set the price when the item has them; toppings and choices come from its groups.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Name</Label>
              <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No category</SelectItem>
                  {catalog.categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-description">Description</Label>
            <Textarea id="item-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={1000} />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as ItemKind)}>
                <SelectTrigger aria-label="Kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="pizza">Pizza</SelectItem>
                  <SelectItem value="combo">Combo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-price">Price (no sizes)</Label>
              <Input id="item-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} disabled={sizes.length > 0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-cost">Recipe cost</Label>
              <Input id="item-cost" inputMode="decimal" value={foodCost} onChange={(e) => setFoodCost(e.target.value)} disabled={sizes.length > 0} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Switch checked={active} onCheckedChange={setActive} aria-label="On the menu" /> On the menu
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="flex w-full items-center justify-between text-sm font-semibold">
              Sizes
              <Button type="button" size="sm" variant="ghost" onClick={() => setSizes((s) => [...s, { id: null, name: "", price: "", foodCost: "" }])}>
                <Plus aria-hidden /> Add size
              </Button>
            </legend>
            {sizes.length === 0 ? <p className="text-xs text-muted-foreground">No sizes: the item has one price.</p> : null}
            {sizes.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_100px_auto] gap-2">
                <Input value={s.name} onChange={(e) => setSizes((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Large" aria-label="Size name" maxLength={40} />
                <Input value={s.price} onChange={(e) => setSizes((all) => all.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} placeholder="Price" aria-label="Size price" inputMode="decimal" />
                <Input value={s.foodCost} onChange={(e) => setSizes((all) => all.map((x, j) => (j === i ? { ...x, foodCost: e.target.value } : x)))} placeholder="Cost" aria-label="Size recipe cost" inputMode="decimal" />
                <Button type="button" size="icon" variant="ghost" aria-label="Remove size" onClick={() => setSizes((all) => all.filter((_, j) => j !== i))}>
                  <Trash2 aria-hidden />
                </Button>
              </div>
            ))}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Toppings and choices (in order)</legend>
            {catalog.groups.length === 0 ? <p className="text-xs text-muted-foreground">Add groups (toppings, crusts, sauces) on the right first.</p> : null}
            {catalog.groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={groups.includes(g.id)}
                  onCheckedChange={(v) => setGroups((cur) => (v === true ? [...cur, g.id] : cur.filter((id) => id !== g.id)))}
                />
                {g.name} <span className="text-xs text-muted-foreground">({g.options.filter((o) => o.isActive).length} options)</span>
              </label>
            ))}
          </fieldset>
        </div>
        <FormError message={error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <RoleButton need={["menu.manage"]} disabled={busy || !name.trim()} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save item"}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Add or edit a group of toppings or choices and its options. */
export function GroupDialog({ catalog, group, onClose }: { catalog: Catalog; group: CatalogGroup | null; onClose: () => void }) {
  const sizeNames = [...new Set(catalog.items.flatMap((i) => i.sizes.map((s) => s.name)))];
  const [name, setName] = useState(group?.name ?? "");
  const [kind, setKind] = useState(group?.kind ?? "toppings");
  const [min, setMin] = useState(String(group?.minSelect ?? 0));
  const [max, setMax] = useState(group?.maxSelect != null ? String(group.maxSelect) : "");
  const [halves, setHalves] = useState(group?.allowHalves ?? kind === "toppings");
  const [amounts, setAmounts] = useState(group?.allowAmounts ?? kind === "toppings");
  const [free, setFree] = useState(String(group?.freeQuantity ?? 0));
  const [options, setOptions] = useState(
    (group?.options ?? []).map((o) => ({
      id: o.id as number | null,
      name: o.name,
      price: String(o.price),
      sizePrices: Object.fromEntries(Object.entries(o.sizePrices).map(([k, v]) => [k, String(v)])) as Record<string, string>,
      foodCost: o.foodCost != null ? String(o.foodCost) : "",
      isDefault: o.isDefault,
      isActive: o.isActive,
    })),
  );
  const { busy, error, save } = useSaver(onClose);
  const blank = { id: null, name: "", price: "", sizePrices: {} as Record<string, string>, foodCost: "", isDefault: false, isActive: true };

  const submit = () =>
    save(async () => {
      const fields = {
        name: name.trim(),
        kind,
        minSelect: Math.floor(num(min)),
        maxSelect: max.trim() === "" ? null : Math.floor(num(max)),
        allowHalves: halves,
        allowAmounts: amounts,
        freeQuantity: Math.floor(num(free)),
      };
      const saved = group ? await updateGroup(group.id, fields) : await createGroup(fields);
      await setGroupOptions(
        saved.id,
        options
          .filter((o) => o.name.trim())
          .map((o) => ({
            id: o.id,
            name: o.name.trim(),
            price: num(o.price),
            sizePrices: Object.fromEntries(Object.entries(o.sizePrices).filter(([, v]) => v.trim() !== "").map(([k, v]) => [k, num(v)])),
            foodCost: optNum(o.foodCost),
            isDefault: o.isDefault,
            isActive: o.isActive,
          })),
      );
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{group ? `Edit ${group.name}` : "Add a group"}</DialogTitle>
          <DialogDescription>Toppings can go on half a pizza and come light or extra; a choice is picked from a list.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="group-name">Name</Label>
              <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Toppings, Crust, Sauce…" />
            </div>
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "toppings" | "choice")}>
                <SelectTrigger aria-label="Kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toppings">Toppings</SelectItem>
                  <SelectItem value="choice">Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="group-min">At least</Label>
              <Input id="group-min" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="group-max">At most</Label>
              <Input id="group-max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="No limit" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="group-free">Included</Label>
              <Input id="group-free" inputMode="numeric" value={free} onChange={(e) => setFree(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Switch checked={halves} onCheckedChange={setHalves} aria-label="Halves" /> Halves
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Switch checked={amounts} onCheckedChange={setAmounts} aria-label="Light and extra" /> Light / extra
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="flex w-full items-center justify-between text-sm font-semibold">
              Options
              <Button type="button" size="sm" variant="ghost" onClick={() => setOptions((o) => [...o, { ...blank }])}>
                <Plus aria-hidden /> Add option
              </Button>
            </legend>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1 pr-2 font-medium">Name</th>
                    <th className="py-1 pr-2 font-medium">Price</th>
                    {sizeNames.map((s) => (
                      <th key={s} className="py-1 pr-2 font-medium">
                        {s}
                      </th>
                    ))}
                    <th className="py-1 pr-2 font-medium">Cost</th>
                    <th className="py-1 pr-2 font-medium">Included</th>
                    <th className="py-1 pr-2 font-medium">On</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {options.map((o, i) => {
                    const edit = (change: Partial<typeof o>) => setOptions((all) => all.map((x, j) => (j === i ? { ...x, ...change } : x)));
                    return (
                      <tr key={i}>
                        <td className="py-1 pr-2">
                          <Input value={o.name} onChange={(e) => edit({ name: e.target.value })} aria-label="Option name" className="h-8 min-w-32" maxLength={80} />
                        </td>
                        <td className="py-1 pr-2">
                          <Input value={o.price} onChange={(e) => edit({ price: e.target.value })} aria-label="Option price" className="h-8 w-20" inputMode="decimal" />
                        </td>
                        {sizeNames.map((s) => (
                          <td key={s} className="py-1 pr-2">
                            <Input
                              value={o.sizePrices[s] ?? ""}
                              onChange={(e) => edit({ sizePrices: { ...o.sizePrices, [s]: e.target.value } })}
                              aria-label={`${o.name || "Option"} price on ${s}`}
                              className="h-8 w-20"
                              inputMode="decimal"
                              placeholder="—"
                            />
                          </td>
                        ))}
                        <td className="py-1 pr-2">
                          <Input value={o.foodCost} onChange={(e) => edit({ foodCost: e.target.value })} aria-label="Option cost" className="h-8 w-20" inputMode="decimal" />
                        </td>
                        <td className="py-1 pr-2">
                          <Checkbox checked={o.isDefault} onCheckedChange={(v) => edit({ isDefault: v === true })} aria-label="Included" />
                        </td>
                        <td className="py-1 pr-2">
                          <Checkbox checked={o.isActive} onCheckedChange={(v) => edit({ isActive: v === true })} aria-label="Active" />
                        </td>
                        <td className="py-1">
                          <Button type="button" size="icon" variant="ghost" aria-label="Remove option" onClick={() => setOptions((all) => all.filter((_, j) => j !== i))}>
                            <Trash2 aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">A size column overrides the price for that size; blank uses the price. Removed options are retired, so past orders still name them.</p>
          </fieldset>
        </div>
        <FormError message={error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <RoleButton need={["menu.manage"]} disabled={busy || !name.trim()} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save group"}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
