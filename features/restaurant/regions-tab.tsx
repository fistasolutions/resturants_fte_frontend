"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { Panel, PanelRow } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { createRegion, deleteRegion, renameRegion } from "@/services/restaurant-actions";
import type { Region } from "@/types/restaurant";

function RegionRow({ region, onError }: { region: Region; onError: (message: string | null) => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(region.name);
  const refresh = () => queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
  const run = async (work: () => Promise<unknown>) => {
    onError(null);
    try {
      await work();
      await refresh();
      setEditing(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "That did not work.");
    }
  };
  return (
    <PanelRow
      align="center"
      trailing={
        editing ? (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" aria-label="Save" onClick={() => void run(() => renameRegion(region.id, name.trim()))}>
              <Check aria-hidden />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditing(false)}>
              <X aria-hidden />
            </Button>
          </div>
        ) : (
          <RoleGate need={["network.manage"]}>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label={`Rename ${region.name}`} onClick={() => setEditing(true)}>
                <Pencil aria-hidden />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${region.name}`}
                disabled={region.branches > 0}
                title={region.branches > 0 ? "Move its branches first" : undefined}
                onClick={() => void run(() => deleteRegion(region.id))}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </RoleGate>
        )
      }
    >
      {editing ? (
        <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Region name" className="h-8 max-w-xs" maxLength={120} />
      ) : (
        <>
          <p className="text-sm font-medium text-foreground">{region.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {region.branches} branch{region.branches === 1 ? "" : "es"}
          </p>
        </>
      )}
    </PanelRow>
  );
}

/** Network › Regions (SPEC-377): how the brand groups its branches. */
export function RegionsTab() {
  const queryClient = useQueryClient();
  const query = useApiQuery(restaurantQueries.regions());
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createRegion(name.trim());
      setName("");
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adding the region failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-3">
      <form onSubmit={add} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New region, e.g. North" aria-label="New region" maxLength={120} />
        <RoleButton need={["network.manage"]} type="submit" disabled={busy || !name.trim()}>
          Add region
        </RoleButton>
      </form>
      <FormError message={error} />
      <Panel title="Regions" count={String(query.data.length)}>
        {query.data.map((region) => (
          <RegionRow key={region.id} region={region} onError={setError} />
        ))}
      </Panel>
    </div>
  );
}
