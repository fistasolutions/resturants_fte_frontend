"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { LEDGER_LABELS } from "@/lib/loyalty";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { cn } from "@/lib/utils";
import { adjustPoints } from "@/services/restaurant-os-actions";
import { formatDateTime, formatNumber } from "@/utils/format";

function Member({ id, onClose }: { id: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const detail = useApiQuery(restaurantQueries.loyaltyMember(id));
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (detail.isError) return <QueryErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return <RestaurantSkeleton tiles={0} />;
  const m = detail.data;
  const value = Number(points);
  const adjust = async () => {
    setBusy(true);
    setError(null);
    try {
      await adjustPoints(m.id, value, note.trim());
      setPoints("");
      setNote("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "loyalty-member", m.id] }),
        queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "loyalty-members"] }),
        queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "loyalty"] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjusting failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel
      title={m.name ?? m.phone ?? "Member"}
      aside={
        <Button size="icon" variant="ghost" aria-label="Close the member" onClick={onClose}>
          <X aria-hidden />
        </Button>
      }
    >
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          {[m.phone, m.email].filter(Boolean).join(" · ") || "—"}
          {m.joinedAt ? ` · member since ${formatDateTime(m.joinedAt)}` : ""}
        </p>
        <p className="text-2xl font-bold tabular-nums text-foreground">{formatNumber(m.points)} points</p>
        <div className="flex flex-wrap gap-2">
          <Input value={points} onChange={(e) => setPoints(e.target.value)} placeholder="+50 or −20" aria-label="Points to add or take" inputMode="numeric" className="w-[120px]" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why" aria-label="Why the points change" maxLength={255} className="min-w-[160px] flex-1" />
          <RoleButton need={["loyalty.adjust"]} variant="outline" disabled={busy || !Number.isInteger(value) || value === 0 || !note.trim()} onClick={() => void adjust()}>
            Adjust points
          </RoleButton>
        </div>
        <FormError message={error} />
        <ul className="divide-y divide-border rounded-xl border border-border text-sm">
          {m.ledger.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0 truncate">
                {LEDGER_LABELS[row.kind]}
                {row.note ? <span className="text-muted-foreground"> · {row.note}</span> : null}
                {row.createdAt ? <span className="block text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</span> : null}
              </span>
              <span className={cn("shrink-0 font-semibold tabular-nums", row.points < 0 ? "text-muted-foreground" : "text-foreground")}>
                {row.points > 0 ? "+" : ""}
                {formatNumber(row.points)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/** Loyalty › Members (SPEC-383): find a member, read their points, adjust them. */
export function LoyaltyMembersTab() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const list = useApiQuery(restaurantQueries.loyaltyMembers(query));
  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim() || null);
        }}
      >
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone or email" aria-label="Search members" className="h-9 max-w-xs" />
        <Button type="submit" variant="outline" size="icon" aria-label="Search">
          <Search aria-hidden />
        </Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        {list.isError ? (
          <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : !list.data ? (
          <RestaurantSkeleton tiles={0} />
        ) : list.data.length === 0 ? (
          <EmptyPanel title={query ? "No member matches" : "No members yet"} body="Guests join at the counter or when they order online." />
        ) : (
          <Panel title="Members" count={String(list.data.length)}>
            <ul className="divide-y divide-border">
              {list.data.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-pressed={selected === m.id}
                    onClick={() => setSelected(m.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
                      selected === m.id ? "bg-muted/60" : "",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{m.name ?? "Guest"}</span>
                      <span className="block truncate text-xs text-muted-foreground">{m.phone ?? m.email ?? "—"}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatNumber(m.points)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {selected != null ? <Member key={selected} id={selected} onClose={() => setSelected(null)} /> : null}
      </div>
    </div>
  );
}
