"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Pause, Play, Plug, Trash2 } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { AGGREGATOR_LABELS, PROVIDER_LABELS, absoluteUrl } from "@/lib/marketplaces";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { connectMarketplace, removeMarketplace, rotateMarketplace, setMarketplaceActive } from "@/services/restaurant-os-actions";
import type { MarketplaceAggregator, MarketplaceProvider, MarketplaceSecret } from "@/types/restaurant-os";
import { formatDateTime } from "@/utils/format";

const SELECT =
  "h-9 rounded-input border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

function SecretBox({ secret, onClose }: { secret: MarketplaceSecret; onClose: () => void }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const rows: [string, string][] = [
    ["Order URL", absoluteUrl(origin, secret.ordersUrl)],
    ["Menu URL", absoluteUrl(origin, secret.menuUrl)],
  ];
  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
      <p className="font-medium">Give these to {AGGREGATOR_LABELS[secret.aggregator]} now — the key in them is shown only once.</p>
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-muted-foreground">{label}</span>
          <code className="min-w-0 flex-1 truncate rounded-md bg-background px-2 py-1">{value}</code>
          <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(value)} aria-label={`Copy the ${label}`}>
            <Copy aria-hidden /> Copy
          </Button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={onClose}>
        I have saved them
      </Button>
    </div>
  );
}

/** Marketplace connections (SPEC-393 over backend SPEC-413): DoorDash, Uber Eats and Grubhub orders
 * through an aggregator straight onto the kitchen board, and the branch's menu out. */
export function MarketplacesPanel() {
  const queryClient = useQueryClient();
  const rows = useApiQuery(restaurantQueries.marketplaces());
  const branches = useApiQuery(restaurantQueries.branches({ status: "open" }));
  const [branchId, setBranchId] = useState("");
  const [provider, setProvider] = useState<MarketplaceProvider>("doordash");
  const [aggregator, setAggregator] = useState<MarketplaceAggregator>("deliverect");
  const [externalRef, setExternalRef] = useState("");
  const [secret, setSecret] = useState<MarketplaceSecret | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "marketplaces"] });
  const run = async (body: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await body();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Marketplaces</h2>
        <p className="text-sm text-muted-foreground">
          Connect a branch&apos;s DoorDash, Uber Eats or Grubhub through your aggregator. Their orders arrive on the kitchen board,
          already paid, and the aggregator reads the branch&apos;s menu and prices from here.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="mp-branch" className="text-xs text-muted-foreground">
            Branch
          </Label>
          <select id="mp-branch" className={SELECT} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Choose a branch</option>
            {(branches.data ?? []).map((b) => (
              <option key={b.id} value={String(b.id)}>
                #{b.code} {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="mp-provider" className="text-xs text-muted-foreground">
            Marketplace
          </Label>
          <select id="mp-provider" className={SELECT} value={provider} onChange={(e) => setProvider(e.target.value as MarketplaceProvider)}>
            {(Object.keys(PROVIDER_LABELS) as MarketplaceProvider[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="mp-aggregator" className="text-xs text-muted-foreground">
            Through
          </Label>
          <select id="mp-aggregator" className={SELECT} value={aggregator} onChange={(e) => setAggregator(e.target.value as MarketplaceAggregator)}>
            {(Object.keys(AGGREGATOR_LABELS) as MarketplaceAggregator[]).map((a) => (
              <option key={a} value={a}>
                {AGGREGATOR_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="mp-ref" className="text-xs text-muted-foreground">
            Aggregator location id (optional)
          </Label>
          <Input id="mp-ref" value={externalRef} onChange={(e) => setExternalRef(e.target.value)} className="h-9 w-48" />
        </div>
        <RoleButton
          need={["network.manage"]}
          disabled={busy || !branchId}
          onClick={() =>
            void run(async () => {
              setSecret(await connectMarketplace(Number(branchId), provider, aggregator, externalRef.trim() || null));
              setExternalRef("");
            })
          }
        >
          <Plug aria-hidden /> Connect
        </RoleButton>
      </div>
      {secret ? <SecretBox secret={secret} onClose={() => setSecret(null)} /> : null}
      <FormError message={error} />
      {rows.data && rows.data.length ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {rows.data.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <span className="font-medium">{c.branch}</span>
              <span>{PROVIDER_LABELS[c.provider]}</span>
              <span className="text-xs text-muted-foreground">via {AGGREGATOR_LABELS[c.aggregator].split(" (")[0]} · key …{c.tokenLast4}</span>
              <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status === "active" ? "Live" : "Paused"}</Badge>
              <span className="text-xs text-muted-foreground">
                {c.ordersCount} orders{c.lastOrderAt ? ` · last ${formatDateTime(c.lastOrderAt)}` : ""}
              </span>
              <span className="ml-auto flex gap-1">
                <RoleButton need={["network.manage"]} size="sm" variant="outline" disabled={busy} onClick={() => void run(() => setMarketplaceActive(c.id, c.status !== "active"))}>
                  {c.status === "active" ? <Pause aria-hidden /> : <Play aria-hidden />} {c.status === "active" ? "Pause" : "Resume"}
                </RoleButton>
                <RoleButton need={["network.manage"]} size="sm" variant="outline" disabled={busy} onClick={() => void run(async () => setSecret(await rotateMarketplace(c.id)))}>
                  <KeyRound aria-hidden /> New key
                </RoleButton>
                <RoleButton need={["network.manage"]} size="sm" variant="outline" disabled={busy} onClick={() => void run(() => removeMarketplace(c.id))} aria-label="Remove">
                  <Trash2 aria-hidden />
                </RoleButton>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No marketplace connected yet.</p>
      )}
    </section>
  );
}
