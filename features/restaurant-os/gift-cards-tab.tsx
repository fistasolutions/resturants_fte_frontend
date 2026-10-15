"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyPanel, Figure, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { GIFT_TXN_LABELS } from "@/lib/loyalty";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { cn } from "@/lib/utils";
import { adjustGiftCard, setGiftCardStatus } from "@/services/restaurant-os-actions";
import { formatCurrency, formatDateTime, formatNumber } from "@/utils/format";

function Card({ id, onClose }: { id: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const detail = useApiQuery(restaurantQueries.giftCard(id));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (detail.isError) return <QueryErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return <RestaurantSkeleton tiles={0} />;
  const c = detail.data;
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      setAmount("");
      setNote("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "gift-card", c.id] }),
        queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "gift-cards"] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };
  const value = Number(amount);
  return (
    <Panel
      title={`Card ···${c.last4}`}
      aside={
        <Button size="icon" variant="ghost" aria-label="Close the card" onClick={onClose}>
          <X aria-hidden />
        </Button>
      }
    >
      <div className="space-y-4 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(c.balance)}</p>
          <Badge variant="outline">{c.status === "active" ? "Active" : "Disabled"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Sold for {formatCurrency(c.initialValue)}
          {c.createdAt ? ` on ${formatDateTime(c.createdAt)}` : ""}
          {c.recipientName ? ` · for ${c.recipientName}` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <RoleButton need={["gift_cards.manage"]} variant="outline" size="sm" disabled={busy} onClick={() => void run(() => setGiftCardStatus(c.id, c.status !== "active"))}>
            {c.status === "active" ? "Disable" : "Enable"}
          </RoleButton>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="+10 or −5" aria-label="Amount to add or take" inputMode="decimal" className="w-[120px]" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why" aria-label="Why the balance changes" maxLength={255} className="min-w-[160px] flex-1" />
          <RoleButton need={["gift_cards.manage"]} variant="outline" disabled={busy || !Number.isFinite(value) || value === 0 || !note.trim()} onClick={() => void run(() => adjustGiftCard(c.id, value, note.trim()))}>
            Adjust balance
          </RoleButton>
        </div>
        <FormError message={error} />
        <ul className="divide-y divide-border rounded-xl border border-border text-sm">
          {c.transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0 truncate">
                {GIFT_TXN_LABELS[t.kind]}
                {t.tender ? <span className="text-muted-foreground"> · {t.tender === "cash" ? "cash" : "card"}</span> : null}
                {t.note ? <span className="text-muted-foreground"> · {t.note}</span> : null}
                {t.createdAt ? <span className="block text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</span> : null}
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className={cn("block font-semibold", t.amount < 0 ? "text-muted-foreground" : "text-foreground")}>
                  {t.amount > 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(t.amount))}
                </span>
                <span className="block text-xs text-muted-foreground">{formatCurrency(t.balanceAfter)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/** Loyalty › Gift cards (SPEC-383): find a card by its last four, read it, correct it. */
export function GiftCardsTab() {
  const [search, setSearch] = useState("");
  const [last4, setLast4] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const list = useApiQuery(restaurantQueries.giftCards(last4, status === "all" ? null : status));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setLast4(search.trim().toUpperCase().slice(-4) || null);
          }}
        >
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Last four of the code" aria-label="Last four of the code" maxLength={4} className="h-9 w-[180px]" />
          <Button type="submit" variant="outline" size="icon" aria-label="Search">
            <Search aria-hidden />
          </Button>
        </form>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cards</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {list.data?.totals ? (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          <Figure label="Cards sold" value={formatNumber(list.data.totals.cards)} />
          <Figure label="Still on cards" value={formatCurrency(list.data.totals.outstanding)} hint="money guests have yet to spend" />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        {list.isError ? (
          <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : !list.data ? (
          <RestaurantSkeleton tiles={0} />
        ) : list.data.cards.length === 0 ? (
          <EmptyPanel title={last4 ? "No card ends that way" : "No gift cards yet"} body="Cards are sold at the counter on Order Taking." />
        ) : (
          <Panel title="Gift cards" count={String(list.data.cards.length)}>
            <ul className="divide-y divide-border">
              {list.data.cards.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={selected === c.id}
                    onClick={() => setSelected(c.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
                      selected === c.id ? "bg-muted/60" : "",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium tabular-nums text-foreground">···{c.last4}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.createdAt ? formatDateTime(c.createdAt) : "—"}
                        {c.recipientName ? ` · ${c.recipientName}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {c.status !== "active" ? <Badge variant="outline">Disabled</Badge> : null}
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(c.balance)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {selected != null ? <Card key={selected} id={selected} onClose={() => setSelected(null)} /> : null}
      </div>
    </div>
  );
}
