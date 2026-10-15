"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyPanel, Figure, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { BranchPicker, useBranchChoice } from "@/features/restaurant-os/branch-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { CHANNEL_NAMES, MOVEMENT_LABELS, drawerLines, paymentLabel } from "@/lib/restaurant-os";
import { cn } from "@/lib/utils";
import { closeDrawer, openDrawer, recordDrawerMovement, reopenDrawer } from "@/services/restaurant-os-actions";
import type { CashDay, CashDrawer } from "@/types/restaurant-os";
import { formatCurrency, formatTime } from "@/utils/format";

type ManualKind = "paid_in" | "paid_out" | "drop";

function useRun(branchId: number) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (work: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await work();
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "cash", branchId] });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function Drawer({ day, drawer }: { day: CashDay; drawer: CashDrawer | null }) {
  const { busy, error, run } = useRun(day.branchId);
  const [float, setFloat] = useState("");
  const [kind, setKind] = useState<ManualKind>("paid_in");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const amountValue = Number(amount);
  const countedValue = Number(counted);

  const opening = (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => openDrawer(day.branchId, Number(float) || 0, day.date)).then((ok) => ok && setFloat(""));
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="cash-float">Opening float</Label>
        <Input id="cash-float" value={float} onChange={(e) => setFloat(e.target.value)} placeholder="0.00" inputMode="decimal" className="w-[140px]" />
      </div>
      <RoleButton need={["cash.manage"]} type="submit" disabled={busy || (float.trim() !== "" && !(Number(float) >= 0))}>
        {drawer ? "Set the float" : "Open the drawer"}
      </RoleButton>
    </form>
  );

  if (!drawer) {
    return (
      <Panel title="Drawer" aside={<Badge variant="outline">Not opened</Badge>}>
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            Open the drawer with the cash it starts the day with. A cash sale opens it on its own, with no float, if no one has.
          </p>
          {opening}
          <FormError message={error} />
        </div>
      </Panel>
    );
  }

  const closed = drawer.status === "closed";
  return (
    <Panel title="Drawer" aside={<Badge variant="outline">{closed ? "Closed" : "Open"}</Badge>}>
      <div className="space-y-4 p-4">
        <dl className="space-y-1 text-sm tabular-nums">
          {drawerLines(drawer).map((line) => (
            <div key={line.label} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd>
                {line.sign < 0 && line.amount > 0 ? "−" : ""}
                {formatCurrency(line.amount)}
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-2 border-t border-border pt-1 font-semibold">
            <dt>Cash expected</dt>
            <dd>{formatCurrency(drawer.expectedCash)}</dd>
          </div>
          {closed ? (
            <>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Counted</dt>
                <dd>{formatCurrency(drawer.countedCash ?? 0)}</dd>
              </div>
              <div className={cn("flex justify-between gap-2 font-semibold", (drawer.variance ?? 0) !== 0 ? "text-warning" : "text-foreground")}>
                <dt>{(drawer.variance ?? 0) < 0 ? "Short" : (drawer.variance ?? 0) > 0 ? "Over" : "Balanced"}</dt>
                <dd>{formatCurrency(Math.abs(drawer.variance ?? 0))}</dd>
              </div>
              {drawer.notes ? <p className="pt-1 text-xs text-muted-foreground">{drawer.notes}</p> : null}
            </>
          ) : null}
        </dl>

        {closed ? (
          <RoleButton need={["cash.manage"]} variant="outline" disabled={busy} onClick={() => void run(() => reopenDrawer(drawer.id))}>
            Reopen the day
          </RoleButton>
        ) : (
          <>
            {drawer.openingFloat === 0 ? opening : null}
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => recordDrawerMovement(drawer.id, kind, amountValue, note.trim() || null)).then((ok) => {
                  if (ok) {
                    setAmount("");
                    setNote("");
                  }
                });
              }}
            >
              <Select value={kind} onValueChange={(v) => setKind(v as ManualKind)}>
                <SelectTrigger className="w-[130px]" aria-label="Kind of cash movement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["paid_in", "paid_out", "drop"] as const).map((k) => (
                    <SelectItem key={k} value={k}>
                      {MOVEMENT_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" aria-label="Amount" inputMode="decimal" className="w-[110px]" />
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={kind === "paid_out" ? "What for (needed)" : "Note"}
                aria-label="Note"
                maxLength={255}
                className="min-w-[160px] flex-1"
              />
              <RoleButton
                need={["cash.manage"]}
                type="submit"
                variant="outline"
                disabled={busy || !(amountValue > 0) || (kind === "paid_out" && !note.trim())}
              >
                Record
              </RoleButton>
            </form>
            <form
              className="flex flex-wrap items-end gap-2 border-t border-border pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => closeDrawer(drawer.id, countedValue, notes.trim() || null)).then((ok) => {
                  if (ok) {
                    setCounted("");
                    setNotes("");
                  }
                });
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="cash-counted">Cash counted</Label>
                <Input id="cash-counted" value={counted} onChange={(e) => setCounted(e.target.value)} placeholder="0.00" inputMode="decimal" className="w-[140px]" />
              </div>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for the day" aria-label="Notes for the day" className="min-w-[160px] flex-1" />
              <RoleButton need={["cash.manage"]} type="submit" disabled={busy || counted.trim() === "" || !(countedValue >= 0)}>
                Close the day
              </RoleButton>
            </form>
          </>
        )}
        <FormError message={error} />
      </div>
    </Panel>
  );
}

function Report({ day }: { day: CashDay }) {
  const r = day.report;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Figure label="Net sales" value={formatCurrency(r.netSales)} hint={`${r.orders} orders`} />
        <Figure label="Gross sales" value={formatCurrency(r.grossSales)} hint={`discounts ${formatCurrency(r.discounts)}`} />
        <Figure label="Refunds" value={formatCurrency(r.refunds)} hint={`${r.voids} voided · ${formatCurrency(r.voidValue)}`} />
        <Figure label="Tax · tips" value={formatCurrency(r.tax)} hint={`tips ${formatCurrency(r.tips)} · delivery fees ${formatCurrency(r.deliveryFees)}`} />
      </div>
      {r.giftCardsSold > 0 ? (
        <p className="text-sm text-muted-foreground">
          Gift cards sold: <span className="font-semibold text-foreground">{formatCurrency(r.giftCardsSold)}</span> ({formatCurrency(r.giftCardsSoldCash)} in cash). Not
          sales — they count when the cards are spent.
        </p>
      ) : null}
      {r.openOrders > 0 ? (
        <p className="text-sm text-warning">
          {r.openOrders} order{r.openOrders === 1 ? " is" : "s are"} still open — they count once they are finished.
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="By tender">
          {r.byTender.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No money taken that day.</p>
          ) : (
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Tender</th>
                  <th className="px-2 py-2 text-right font-medium">Payments</th>
                  <th className="px-2 py-2 text-right font-medium">Taken</th>
                  <th className="px-2 py-2 text-right font-medium">Refunded</th>
                  <th className="px-4 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {r.byTender.map((t) => (
                  <tr key={t.method}>
                    <td className="px-4 py-2">{paymentLabel(t.method)}</td>
                    <td className="px-2 py-2 text-right">{t.payments}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(t.amount)}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(t.refunded)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(t.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="By channel">
          {r.byChannel.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No finished orders that day.</p>
          ) : (
            <ul className="divide-y divide-border text-sm tabular-nums">
              {r.byChannel.map((c) => (
                <li key={c.channel} className="flex justify-between gap-2 px-4 py-2">
                  <span>
                    {CHANNEL_NAMES[c.channel] ?? c.channel} <span className="text-muted-foreground">· {c.orders}</span>
                  </span>
                  <span className="font-semibold">{formatCurrency(c.netSales)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      {day.movements.length ? (
        <Panel title="Cash movements" count={String(day.movements.length)}>
          <ul className="divide-y divide-border text-sm tabular-nums">
            {day.movements.map((m) => (
              <li key={m.id} className="flex justify-between gap-2 px-4 py-2">
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">{m.createdAt ? formatTime(m.createdAt) : "—"}</span> · {MOVEMENT_LABELS[m.kind]}
                  {m.note ? <span className="text-muted-foreground"> · {m.note}</span> : null}
                </span>
                <span>
                  {m.kind === "cash_sale" || m.kind === "paid_in" || m.kind === "gift_card_sale" ? "" : "−"}
                  {formatCurrency(m.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

/** Cash & Day Close (SPEC-380 / backend SPEC-395): one branch, one business day. */
export function CashView() {
  const { branches, branch, loading, error: branchError } = useBranchChoice();
  const [date, setDate] = useState("");
  const day = useApiQuery(branch ? restaurantQueries.cashDay(branch.id, date || null) : null, { refetchInterval: 60_000 });
  if (branchError) return <QueryErrorState error={branchError} onRetry={() => window.location.reload()} />;
  if (loading) return <RestaurantSkeleton tiles={0} />;
  if (!branch) return <EmptyPanel title="No branch to close" body="Your access covers no open branch." />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <BranchPicker branches={branches} branch={branch} />
        <div className="space-y-1">
          <Label htmlFor="cash-date" className="text-xs text-muted-foreground">
            Business day
          </Label>
          <Input id="cash-date" type="date" value={date || day.data?.date || ""} onChange={(e) => setDate(e.target.value)} className="h-9 w-[160px]" />
        </div>
        {day.data && !day.data.isToday ? <Badge variant="outline">Not today</Badge> : null}
      </div>
      {day.isError ? (
        <QueryErrorState error={day.error} onRetry={() => void day.refetch()} />
      ) : !day.data ? (
        <RestaurantSkeleton tiles={4} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Drawer key={`${day.data.branchId}-${day.data.date}`} day={day.data} drawer={day.data.drawer} />
          <Report day={day.data} />
        </div>
      )}
    </div>
  );
}
