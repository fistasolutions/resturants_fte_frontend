"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { WEEKDAYS } from "@/lib/restaurant";
import { CHANNEL_NAMES } from "@/lib/restaurant-os";
import { createDeal, updateDeal } from "@/services/restaurant-os-actions";
import type { Catalog, Deal, DealKind, OrderChannel } from "@/types/restaurant-os";
import { formatCurrency } from "@/utils/format";

const KIND_LABELS: Record<DealKind, string> = {
  percent_off: "Percent off the order",
  amount_off: "Amount off the order",
  free_delivery: "Free delivery",
  size_price: "Set price for a size",
};
const NONE = "none";

export function dealSummary(deal: Pick<Deal, "kind" | "value" | "sizeName">): string {
  switch (deal.kind) {
    case "percent_off":
      return `${deal.value}% off`;
    case "amount_off":
      return `${formatCurrency(deal.value)} off`;
    case "free_delivery":
      return "Free delivery";
    default:
      return `${deal.sizeName ?? "Item"} for ${formatCurrency(deal.value)}`;
  }
}

function DealDialog({ catalog, deal, onClose }: { catalog: Catalog; deal: Deal | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const sizeNames = [...new Set(catalog.items.flatMap((i) => i.sizes.map((s) => s.name)))];
  const [name, setName] = useState(deal?.name ?? "");
  const [code, setCode] = useState(deal?.code ?? "");
  const [kind, setKind] = useState<DealKind>(deal?.kind ?? "percent_off");
  const [value, setValue] = useState(String(deal?.value ?? ""));
  const [categoryId, setCategoryId] = useState(deal?.categoryId != null ? String(deal.categoryId) : NONE);
  const [sizeName, setSizeName] = useState(deal?.sizeName ?? NONE);
  const [minimum, setMinimum] = useState(String(deal?.minSubtotal ?? 0));
  const [weekdays, setWeekdays] = useState<number[]>(deal?.weekdays ?? []);
  const [channels, setChannels] = useState<string[]>(deal?.channels ?? []);
  const [startsOn, setStartsOn] = useState(deal?.startsOn ?? "");
  const [endsOn, setEndsOn] = useState(deal?.endsOn ?? "");
  const [active, setActive] = useState(deal?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const input = {
      name: name.trim(),
      code: code.trim() || null,
      kind,
      value: Number(value) || 0,
      categoryId: categoryId === NONE ? null : Number(categoryId),
      sizeName: sizeName === NONE ? null : sizeName,
      minSubtotal: Number(minimum) || 0,
      weekdays,
      channels,
      startsOn: startsOn || null,
      endsOn: endsOn || null,
      isActive: active,
    };
    try {
      if (deal) await updateDeal(deal.id, input);
      else await createDeal(input);
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving the offer failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{deal ? `Edit ${deal.name}` : "Add an offer"}</DialogTitle>
          <DialogDescription>With a code it is a coupon; without one it applies by itself. Only the best offer applies to an order.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deal-name">Name</Label>
              <Input id="deal-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Tuesday large deal" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-code">Coupon code</Label>
              <Input id="deal-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={40} placeholder="Blank = automatic" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as DealKind)}>
                <SelectTrigger aria-label="Kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABELS) as DealKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {kind !== "free_delivery" ? (
              <div className="space-y-1.5">
                <Label htmlFor="deal-value">{kind === "percent_off" ? "Percent" : "Amount"}</Label>
                <Input id="deal-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
            ) : null}
          </div>
          {kind === "size_price" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger aria-label="Category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Any category</SelectItem>
                    {catalog.categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Size</Label>
                <Select value={sizeName} onValueChange={setSizeName}>
                  <SelectTrigger aria-label="Size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Any size</SelectItem>
                    {sizeNames.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="deal-min">Minimum order</Label>
              <Input id="deal-min" inputMode="decimal" value={minimum} onChange={(e) => setMinimum(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-start">Starts</Label>
              <Input id="deal-start" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-end">Ends</Label>
              <Input id="deal-end" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
            </div>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Days (none = every day)</legend>
            <div className="flex flex-wrap gap-3">
              {WEEKDAYS.map((day, i) => (
                <label key={day} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={weekdays.includes(i)} onCheckedChange={() => setWeekdays((w) => toggle(w, i))} /> {day}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Order types (none = all)</legend>
            <div className="flex flex-wrap gap-3">
              {(["delivery", "carryout", "dine_in"] as OrderChannel[]).map((c) => (
                <label key={c} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={channels.includes(c)} onCheckedChange={() => setChannels((list) => toggle(list, c))} /> {CHANNEL_NAMES[c]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={active} onCheckedChange={setActive} aria-label="Active" /> Active
          </label>
        </div>
        <FormError message={error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <RoleButton need={["menu.manage"]} disabled={busy || !name.trim()} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save offer"}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Menu › Offers (SPEC-379 over backend SPEC-392): coupons and automatic deals. */
export function OffersTab() {
  const query = useApiQuery(restaurantQueries.catalog());
  const [editing, setEditing] = useState<Deal | null | "new">(null);
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;
  const deals = query.data.deals;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RoleButton need={["menu.manage"]} onClick={() => setEditing("new")}>
          <Plus aria-hidden /> Add offer
        </RoleButton>
      </div>
      {deals.length === 0 ? (
        <EmptyPanel title="No offers yet" body="Add a coupon code, or a deal that applies by itself — like any large pizza for a set price on Tuesdays." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden md:table-cell">When</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((d) => (
                <TableRow key={d.id} className={d.isActive ? undefined : "opacity-60"}>
                  <TableCell>
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dealSummary(d)}
                      {d.minSubtotal ? ` · over ${formatCurrency(d.minSubtotal)}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>{d.code ? <Badge variant="outline">{d.code}</Badge> : <span className="text-xs text-muted-foreground">Automatic</span>}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {d.weekdays.length ? d.weekdays.map((w) => WEEKDAYS[w]).join(", ") : "Every day"}
                    {d.channels.length ? ` · ${d.channels.map((c) => CHANNEL_NAMES[c as OrderChannel] ?? c).join(", ")}` : ""}
                    {d.endsOn ? ` · until ${d.endsOn}` : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <RoleGate need={["menu.manage"]}>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(d)}>
                        Edit
                      </Button>
                    </RoleGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {editing ? <DealDialog catalog={query.data} deal={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
