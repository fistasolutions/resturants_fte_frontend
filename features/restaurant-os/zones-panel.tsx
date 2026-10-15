"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Trash2, Undo2 } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { GeoMap, type MapMarker, type MapPolygon } from "@/features/restaurant-os/geo-map";
import { useApiQuery } from "@/hooks/use-api-query";
import { addCorner, isDrawable, undoCorner, type LatLng } from "@/lib/geo-map";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { updateBranch } from "@/services/restaurant-actions";
import { createZone, deleteZone, updateZone } from "@/services/restaurant-os-actions";
import type { Branch } from "@/types/restaurant";
import { formatCurrency } from "@/utils/format";

/** Network › branch › Delivery zones (SPEC-384 over backend SPEC-400): the branch's delivery area
 * drawn on a map, each zone with its fee, minimum and extra minutes. */
export function ZonesPanel({ branch }: { branch: Branch }) {
  const queryClient = useQueryClient();
  const zones = useApiQuery(restaurantQueries.zones(branch.id));
  const [mode, setMode] = useState<"idle" | "draw" | "place">("idle");
  const [corners, setCorners] = useState<[number, number][]>([]);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const [minimum, setMinimum] = useState("");
  const [minutes, setMinutes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const home = useMemo<LatLng | null>(
    () => (branch.latitude != null && branch.longitude != null ? { lat: branch.latitude, lng: branch.longitude } : null),
    [branch.latitude, branch.longitude],
  );
  const list = useMemo(() => zones.data ?? [], [zones.data]);

  const polygons = useMemo<MapPolygon[]>(
    () => [
      ...list.map((z) => ({ id: `z${z.id}`, points: z.polygon, label: `${z.name} · ${formatCurrency(z.fee)}`, tone: z.isActive ? ("zone" as const) : ("muted" as const) })),
      ...(corners.length ? [{ id: "draft", points: corners, tone: "draft" as const }] : []),
    ],
    [list, corners],
  );
  const markers = useMemo<MapMarker[]>(() => {
    const where = pin ?? home;
    return where ? [{ id: "branch", point: where, kind: "branch", label: "B", title: branch.name }] : [];
  }, [pin, home, branch.name]);

  if (zones.isError) return <QueryErrorState error={zones.error} onRetry={() => void zones.refetch()} />;
  if (!zones.data) return <RestaurantSkeleton tiles={0} />;

  const refresh = () => queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "zones", branch.id] });
  const run = async (work: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      after?.();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };
  const resetDraft = () => {
    setMode("idle");
    setCorners([]);
    setName("");
    setFee("");
    setMinimum("");
    setMinutes("");
  };
  const save = () =>
    run(
      () =>
        createZone(branch.id, {
          name: name.trim(),
          polygon: corners,
          fee: Number(fee) || 0,
          minimum: Number(minimum) || 0,
          extraMinutes: Math.round(Number(minutes) || 0),
        }),
      resetDraft,
    );
  const placeBranch = () =>
    run(
      async () => {
        if (!pin) return;
        await updateBranch(branch.id, { latitude: pin.lat, longitude: pin.lng });
        await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "branch", branch.id] });
        await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "branches"] });
      },
      () => {
        setMode("idle");
        setPin(null);
      },
    );

  return (
    <Panel title="Delivery zones" count={String(list.length)}>
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          {list.some((z) => z.isActive)
            ? "This branch delivers inside its zones. Each zone sets its own fee and minimum and the minutes it adds; an online address must fall inside one."
            : "No zone drawn: the branch delivers to the postal codes in its Service settings. Draw zones to deliver by the map instead."}
        </p>
        {!home && mode !== "place" ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <span>The branch has no place on the map yet.</span>
            <RoleButton need={["network.manage"]} size="sm" variant="outline" onClick={() => setMode("place")}>
              <MapPin aria-hidden /> Place it
            </RoleButton>
          </div>
        ) : null}
        <GeoMap
          label={`${branch.name} delivery zones`}
          polygons={polygons}
          markers={markers}
          fitKey={`${branch.id}-${list.map((z) => z.id).join(",")}-${home ? "h" : "-"}`}
          onMapClick={
            mode === "draw"
              ? (point) => setCorners((c) => addCorner(c, point))
              : mode === "place"
                ? (point) => setPin(point)
                : undefined
          }
          className="h-80"
        />
        {mode === "place" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{pin ? "Tap again to move the pin." : "Tap the map where the branch is."}</span>
            <RoleButton need={["network.manage"]} size="sm" disabled={!pin || busy} onClick={() => void placeBranch()}>
              Save the branch&apos;s place
            </RoleButton>
            <Button size="sm" variant="ghost" onClick={() => { setMode("idle"); setPin(null); }}>
              Cancel
            </Button>
          </div>
        ) : null}
        {mode === "draw" ? (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <p className="text-sm text-muted-foreground">Tap the map to add the zone&apos;s corners in order ({corners.length} so far).</p>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="zn-name">Name</Label>
                <Input id="zn-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Downtown" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zn-fee">Delivery fee</Label>
                <Input id="zn-fee" value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zn-min">Order minimum</Label>
                <Input id="zn-min" value={minimum} onChange={(e) => setMinimum(e.target.value)} inputMode="decimal" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zn-minutes">Extra minutes</Label>
                <Input id="zn-minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="numeric" placeholder="0" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!corners.length} onClick={() => setCorners(undoCorner)}>
                <Undo2 aria-hidden /> Undo
              </Button>
              <Button size="sm" variant="ghost" disabled={!corners.length} onClick={() => setCorners([])}>
                Clear
              </Button>
              <RoleButton need={["branch.manage"]} size="sm" disabled={busy || !isDrawable(corners) || !name.trim()} onClick={() => void save()}>
                Save zone
              </RoleButton>
              <Button size="sm" variant="ghost" onClick={resetDraft}>
                Cancel
              </Button>
            </div>
          </div>
        ) : mode === "idle" ? (
          <RoleButton need={["branch.manage"]} size="sm" variant="outline" onClick={() => setMode("draw")}>
            Draw a zone
          </RoleButton>
        ) : null}
        <FormError message={error} />
        {list.length ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {list.map((z) => (
              <li key={z.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-foreground">{z.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · fee {formatCurrency(z.fee)} · minimum {formatCurrency(z.minimum)}
                    {z.extraMinutes ? ` · +${z.extraMinutes} min` : ""} · {z.polygon.length} corners
                  </span>
                </span>
                <RoleGate need={["branch.manage"]}>
                  <span className="flex items-center gap-2">
                    <Switch
                      checked={z.isActive}
                      disabled={busy}
                      onCheckedChange={(on) => void run(() => updateZone(branch.id, z.id, { isActive: on }))}
                      aria-label={`${z.name} on`}
                    />
                    <Button size="icon" variant="ghost" disabled={busy} aria-label={`Delete ${z.name}`} onClick={() => void run(() => deleteZone(branch.id, z.id))}>
                      <Trash2 aria-hidden />
                    </Button>
                  </span>
                </RoleGate>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Panel>
  );
}
