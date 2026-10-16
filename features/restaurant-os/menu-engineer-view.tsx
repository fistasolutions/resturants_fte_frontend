"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { ACCEPT_LABELS, KIND_LABELS, KIND_ORDER, byKind, pct } from "@/lib/menu-engineer";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { cn } from "@/lib/utils";
import { decideMenuSuggestion } from "@/services/restaurant-os-actions";
import type { MenuSuggestion, MenuSuggestionKind } from "@/types/restaurant-os";
import { formatCurrency, formatDateTime } from "@/utils/format";

const DAYS = [7, 30, 90] as const;

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

/** The Menu Engineer (SPEC-391 over backend SPEC-409). */
export function MenuEngineerView() {
  const queryClient = useQueryClient();
  const setup = useApiQuery(restaurantQueries.setup());
  const isHq = setup.data?.scope.isHq ?? false;
  const [days, setDays] = useState<number>(30);
  const [kind, setKind] = useState<MenuSuggestionKind | "all">("all");
  const data = useApiQuery(restaurantQueries.menuEngineer(days));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (s: MenuSuggestion, decision: "accept" | "dismiss") => {
    const key = `${s.menuItemId}-${s.kind}-${decision}`;
    setBusy(key);
    setError(null);
    try {
      const next = await decideMenuSuggestion(s.menuItemId, s.kind, decision, days);
      queryClient.setQueryData([...RESTAURANT_KEY, "menu-engineer", days], next);
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  };

  if (data.isError) return <QueryErrorState error={data.error} onRetry={() => void data.refetch()} />;
  if (!data.data) return <RestaurantSkeleton tiles={4} />;
  const page = data.data;
  const shown = byKind(page.suggestions, kind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Period">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days === d}
            onClick={() => setDays(d)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              days === d ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
            )}
          >
            Last {d} days
          </button>
        ))}
        <span className="text-xs text-muted-foreground">
          {page.period.from} – {page.period.to}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Changes to decide" value={String(page.suggestions.length)} />
        <Tile label="Re-prices worth (est.)" value={formatCurrency(page.worth)} />
        <Tile label="To retire" value={String(page.counts.retire)} />
        <Tile label="To push" value={String(page.counts.promote)} />
      </div>
      <FormError message={error} />
      {!isHq ? <p className="text-sm text-muted-foreground">The menu is head office&apos;s: you can see the suggestions, head office decides them.</p> : null}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter suggestions">
        {(["all", ...KIND_ORDER] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              kind === k ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
            )}
          >
            {k === "all" ? "All" : KIND_LABELS[k]} <span className="tabular-nums">{k === "all" ? page.suggestions.length : page.counts[k]}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyPanel
          title="Nothing to change"
          body="Every dish is earning its place — or there are not enough orders yet in this period to judge. Try a longer period."
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((s) => (
            <li key={`${s.menuItemId}-${s.kind}`} className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={s.kind === "reprice" ? "default" : "secondary"}>{KIND_LABELS[s.kind]}</Badge>
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.category}</span>
              </div>
              <p className="text-sm text-muted-foreground">{s.text}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {s.units} sold · {formatCurrency(s.price)} · food cost {pct(s.foodCostPct)}
                {s.newPrice !== null ? (
                  <>
                    {" "}· new price <span className="font-semibold text-foreground">{formatCurrency(s.newPrice)}</span>
                  </>
                ) : null}
                {s.worth !== null ? <> · worth about {formatCurrency(s.worth)} a period</> : null}
              </p>
              {isHq ? (
                <div className="flex flex-wrap gap-2">
                  <RoleButton need={["network.manage"]} size="sm" disabled={busy !== null} onClick={() => void decide(s, "accept")}>
                    <Check aria-hidden /> {ACCEPT_LABELS[s.kind]}
                  </RoleButton>
                  <RoleButton need={["network.manage"]} size="sm" variant="outline" disabled={busy !== null} onClick={() => void decide(s, "dismiss")}>
                    <X aria-hidden /> Not now
                  </RoleButton>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {page.decisions.length ? (
        <Panel title="Decided" count={String(page.decisions.length)}>
          <ul className="divide-y divide-border">
            {page.decisions.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground">
                  {KIND_LABELS[d.kind]} · {d.status === "accepted" ? "applied" : "not now"}
                  {d.newPrice !== null && d.oldPrice !== null ? ` · ${formatCurrency(d.oldPrice)} → ${formatCurrency(d.newPrice)}` : ""}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {d.decidedBy}
                  {d.createdAt ? ` · ${formatDateTime(d.createdAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
