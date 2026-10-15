"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Figure, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { REWARD_KIND_LABELS, rewardSummary } from "@/lib/loyalty";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { createReward, saveLoyaltyProgram, updateReward } from "@/services/restaurant-os-actions";
import type { LoyaltyOverview, LoyaltyReward, RewardKind } from "@/types/restaurant-os";
import { formatCurrency, formatNumber } from "@/utils/format";

function ProgramForm({ data, isHq }: { data: LoyaltyOverview; isHq: boolean }) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(data.program.enabled);
  const [name, setName] = useState(data.program.name);
  const [rate, setRate] = useState(String(data.program.pointsPerUnit));
  const [welcome, setWelcome] = useState(String(data.program.welcomePoints));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await saveLoyaltyProgram({ enabled, name: name.trim(), pointsPerUnit: Number(rate), welcomePoints: Number(welcome) });
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "loyalty"] });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
    } finally {
      setBusy(false);
    }
  };
  const valid = name.trim() !== "" && Number(rate) >= 0 && Number(rate) <= 100 && Number.isInteger(Number(welcome)) && Number(welcome) >= 0;
  return (
    <Panel title="The program" aside={<Badge variant="outline">{data.program.enabled ? "On" : "Off"}</Badge>}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Members earn points on the food they buy — at the counter, on the phone and online — and spend them on rewards at the
          store. Points are worked out by the backend when an order is finished.
        </p>
        <label className="flex items-center gap-3 text-sm font-medium">
          <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!isHq} aria-label="Program on" />
          Program on
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="lp-name">Name guests see</Label>
            <Input id="lp-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} disabled={!isHq} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lp-rate">Points per 1 spent on food</Label>
            <Input id="lp-rate" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" disabled={!isHq} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lp-welcome">Welcome points</Label>
            <Input id="lp-welcome" value={welcome} onChange={(e) => setWelcome(e.target.value)} inputMode="numeric" disabled={!isHq} />
          </div>
        </div>
        {isHq ? (
          <div className="flex items-center gap-3">
            <RoleButton need={["loyalty.manage"]} disabled={busy || !valid} onClick={() => void save()}>
              {busy ? "Saving…" : "Save"}
            </RoleButton>
            {saved ? <span className="text-sm text-muted-foreground">Saved.</span> : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Head office runs the program.</p>
        )}
        <FormError message={error} />
      </div>
    </Panel>
  );
}

function RewardDialog({ reward, onClose }: { reward: LoyaltyReward | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const catalog = useApiQuery(restaurantQueries.catalog());
  const [name, setName] = useState(reward?.name ?? "");
  const [points, setPoints] = useState(reward ? String(reward.points) : "");
  const [kind, setKind] = useState<RewardKind>(reward?.kind ?? "amount_off");
  const [value, setValue] = useState(reward?.value != null ? String(reward.value) : "");
  const [itemId, setItemId] = useState(reward?.itemId != null ? String(reward.itemId) : "");
  const [active, setActive] = useState(reward?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = (catalog.data?.items ?? []).filter((i) => i.isActive);
  const valid =
    name.trim() !== "" &&
    Number.isInteger(Number(points)) &&
    Number(points) >= 1 &&
    (kind === "amount_off" ? Number(value) > 0 : itemId !== "");
  const save = async () => {
    setBusy(true);
    setError(null);
    const body = {
      name: name.trim(),
      points: Number(points),
      kind,
      value: kind === "amount_off" ? Number(value) : null,
      itemId: kind === "free_item" ? Number(itemId) : null,
      isActive: active,
    };
    try {
      if (reward) await updateReward(reward.id, body);
      else await createReward(body);
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "loyalty"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reward ? "Edit reward" : "New reward"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label htmlFor="rw-name">Name</Label>
            <Input id="rw-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Free garlic knots" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rw-points">Points</Label>
              <Input id="rw-points" value={points} onChange={(e) => setPoints(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as RewardKind)}>
                <SelectTrigger aria-label="Kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REWARD_KIND_LABELS) as RewardKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {REWARD_KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {kind === "amount_off" ? (
            <div className="space-y-1">
              <Label htmlFor="rw-value">Amount off the food</Label>
              <Input id="rw-value" value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Item given free (one, the dearest in the order)</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger aria-label="Item">
                  <SelectValue placeholder={catalog.data ? "Choose an item" : "Loading the menu…"} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={active} onCheckedChange={setActive} aria-label="Offered" /> Offered to members
          </label>
          <FormError message={error} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <RoleButton need={["loyalty.manage"]} disabled={busy || !valid} onClick={() => void save()}>
            {busy ? "Saving…" : "Save"}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Loyalty › Program (SPEC-383): the program's rules and its rewards. */
export function LoyaltyProgramTab({ isHq }: { isHq: boolean }) {
  const overview = useApiQuery(restaurantQueries.loyalty());
  const catalog = useApiQuery(restaurantQueries.catalog());
  const [editing, setEditing] = useState<LoyaltyReward | "new" | null>(null);
  if (overview.isError) return <QueryErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  if (!overview.data) return <RestaurantSkeleton tiles={3} />;
  const data = overview.data;
  const names = new Map((catalog.data?.items ?? []).map((i) => [i.id, i.name]));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Figure label="Members" value={formatNumber(data.members)} />
        <Figure label="Points outstanding" value={formatNumber(data.pointsOutstanding)} hint="members' balances today" />
        <Figure label="Rewards offered" value={formatNumber(data.rewards.filter((r) => r.isActive).length)} />
      </div>
      <ProgramForm key={JSON.stringify(data.program)} data={data} isHq={isHq} />
      <Panel
        title="Rewards"
        count={String(data.rewards.length)}
        aside={
          isHq ? (
            <RoleButton need={["loyalty.manage"]} size="sm" onClick={() => setEditing("new")}>
              <Plus aria-hidden /> New reward
            </RoleButton>
          ) : null
        }
      >
        {data.rewards.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No rewards yet. Members collect points; rewards are what they spend them on.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.rewards.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {r.name} {!r.isActive ? <Badge variant="outline">Not offered</Badge> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(r.points)} points · {rewardSummary(r, (id) => names.get(id), formatCurrency)}
                  </p>
                </div>
                {isHq ? (
                  <RoleGate need={["loyalty.manage"]}>
                    <Button size="icon" variant="ghost" aria-label={`Edit ${r.name}`} onClick={() => setEditing(r)}>
                      <Pencil aria-hidden />
                    </Button>
                  </RoleGate>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {editing ? <RewardDialog reward={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
