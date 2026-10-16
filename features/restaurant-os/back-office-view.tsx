"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Save, Truck, UserPlus } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { OVERTIME_LABELS, ROLE_LABELS, WASTE_REASON_LABELS, addDays, addPlanned, mondayOf, pct, type BackOfficeTab, type PlannedDraft } from "@/lib/back-office";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import {
  addCrewMember,
  addIngredient,
  clockPin,
  fixShift,
  logWaste,
  recordCount,
  recordDelivery,
  saveSchedule,
} from "@/services/restaurant-os-actions";
import type { CrewMember, CrewRole, Ingredient, WasteReason } from "@/types/restaurant-os";
import { formatCurrency, formatTime } from "@/utils/format";

const SELECT =
  "h-9 rounded-input border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";
const today = () => new Date().toISOString().slice(0, 10);

function useRun() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (body: () => Promise<unknown>, keys: string[]) => {
    setBusy(true);
    setError(null);
    try {
      await body();
      await Promise.all(keys.map((k) => queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, k] })));
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

// ── time clock ───────────────────────────────────────────────────────────────

function ClockTab({ branchId }: { branchId: number }) {
  const crew = useApiQuery(restaurantQueries.crew(branchId));
  const day = useApiQuery(restaurantQueries.clockDay(branchId, null));
  const { busy, error, run } = useRun();
  const [name, setName] = useState("");
  const [role, setRole] = useState<CrewRole>("crew");
  const [rate, setRate] = useState("");
  const [pin, setPin] = useState("");
  const [clockWith, setClockWith] = useState("");
  const [breakMin, setBreakMin] = useState("0");
  const [notice, setNotice] = useState<string | null>(null);

  if (crew.isError) return <QueryErrorState error={crew.error} onRetry={() => void crew.refetch()} />;
  if (!crew.data || !day.data) return <RestaurantSkeleton tiles={2} />;

  return (
    <div className="space-y-4">
      <Panel title="Clock in or out">
        <div className="flex flex-wrap items-end gap-2 p-4">
          <div className="space-y-1">
            <Label htmlFor="clock-pin" className="text-xs text-muted-foreground">
              PIN
            </Label>
            <Input id="clock-pin" type="password" inputMode="numeric" maxLength={6} value={clockWith} onChange={(e) => setClockWith(e.target.value)} className="h-9 w-28" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="clock-break" className="text-xs text-muted-foreground">
              Break (minutes, at clock-out)
            </Label>
            <Input id="clock-break" type="number" min={0} value={breakMin} onChange={(e) => setBreakMin(e.target.value)} className="h-9 w-28" />
          </div>
          <RoleButton
            need={["orders.take"]}
            disabled={busy || clockWith.length < 4}
            onClick={() =>
              void run(async () => {
                const result = await clockPin(branchId, clockWith, Number(breakMin) || 0);
                setNotice(`${result.name} clocked ${result.state}.`);
                setClockWith("");
                setBreakMin("0");
              }, ["clock-day"])
            }
          >
            <Clock aria-hidden /> Clock
          </RoleButton>
          {notice ? <span className="text-sm text-muted-foreground">{notice}</span> : null}
        </div>
      </Panel>
      <Panel title={`Today · ${day.data.hours.toFixed(2)} h · ${formatCurrency(day.data.cost)}`}>
        {day.data.shifts.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nobody has clocked in today.</p>
        ) : (
          <ul className="divide-y divide-border">
            {day.data.shifts.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                <span className="flex-1 font-medium">{s.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {s.clockIn ? formatTime(s.clockIn) : ""} – {s.clockOut ? formatTime(s.clockOut) : "on the clock"}
                </span>
                {s.hours !== null ? (
                  <span className="tabular-nums">
                    {s.hours.toFixed(2)} h · {formatCurrency(s.cost ?? 0)}
                  </span>
                ) : (
                  <Badge>On the clock</Badge>
                )}
                {s.source === "edit" ? <Badge variant="outline">Corrected</Badge> : null}
                {s.clockOut ? (
                  <RoleButton
                    need={["network.manage"]}
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      const value = window.prompt("Break in minutes", String(s.breakMinutes));
                      if (value !== null) void run(() => fixShift(s.id, { breakMinutes: Number(value) || 0 }), ["clock-day"]);
                    }}
                  >
                    Break {s.breakMinutes} min
                  </RoleButton>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Crew" count={String(crew.data.length)}>
        <ul className="divide-y divide-border">
          {crew.data.map((m: CrewMember) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
              <span className="flex-1 font-medium">{m.name}</span>
              <span className="text-muted-foreground">{ROLE_LABELS[m.role]}</span>
              <span className="tabular-nums">{formatCurrency(m.hourlyRate)}/h</span>
              {!m.active ? <Badge variant="outline">Inactive</Badge> : null}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2 border-t border-border p-4">
          <Input aria-label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-40" />
          <select aria-label="Role" className={SELECT} value={role} onChange={(e) => setRole(e.target.value as CrewRole)}>
            {(Object.keys(ROLE_LABELS) as CrewRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <Input aria-label="Hourly rate" placeholder="Rate / h" type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className="h-9 w-28" />
          <Input aria-label="PIN (4–6 digits)" placeholder="PIN" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} className="h-9 w-24" />
          <RoleButton
            need={["network.manage"]}
            size="sm"
            disabled={busy || !name.trim() || !rate || !/^\d{4,6}$/.test(pin)}
            onClick={() =>
              void run(async () => {
                await addCrewMember(branchId, { name: name.trim(), role, hourlyRate: Number(rate), pin });
                setName("");
                setRate("");
                setPin("");
              }, ["crew"])
            }
          >
            <UserPlus aria-hidden /> Add
          </RoleButton>
        </div>
      </Panel>
      <FormError message={error} />
    </div>
  );
}

// ── schedule ─────────────────────────────────────────────────────────────────

function ScheduleTab({ branchId }: { branchId: number }) {
  const [week, setWeek] = useState(mondayOf(today()));
  const schedule = useApiQuery(restaurantQueries.schedule(branchId, week));
  const actuals = useApiQuery(restaurantQueries.laborActuals(branchId, week));
  const crew = useApiQuery(restaurantQueries.crew(branchId));
  const { busy, error, run } = useRun();
  const [draft, setDraft] = useState<PlannedDraft[] | null>(null);
  const [row, setRow] = useState<PlannedDraft>({ staffId: 0, day: week, start: "10:00", end: "18:00" });

  if (schedule.isError) return <QueryErrorState error={schedule.error} onRetry={() => void schedule.refetch()} />;
  if (!schedule.data || !crew.data) return <RestaurantSkeleton tiles={0} />;
  const planned: PlannedDraft[] =
    draft ?? schedule.data.days.flatMap((d) => d.shifts.map((s) => ({ staffId: s.staffId, day: d.day, start: s.start, end: s.end })));
  const names = new Map(crew.data.map((m) => [m.id, m.name]));
  const active = crew.data.filter((m) => m.active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="week" className="text-xs text-muted-foreground">
            Week of
          </Label>
          <Input
            id="week"
            type="date"
            value={week}
            onChange={(e) => {
              if (!e.target.value) return;
              setWeek(mondayOf(e.target.value));
              setDraft(null);
            }}
            className="h-9 w-[160px]"
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {schedule.data.days.map((d) => (
          <div key={d.day} className="space-y-1 rounded-2xl border border-border bg-card p-3 text-sm">
            <p className="font-medium">{new Date(`${d.day}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {d.hours.toFixed(1)} h · {formatCurrency(d.cost)}
              {d.expectedSales !== null ? ` · expected ${formatCurrency(d.expectedSales)}` : ""} · labor {pct(d.laborShare)}
            </p>
            {d.over ? <Badge variant="secondary">Labor above 30%</Badge> : null}
            <ul className="space-y-0.5 pt-1">
              {planned
                .filter((p) => p.day === d.day)
                .map((p, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{names.get(p.staffId) ?? "—"}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.start}–{p.end}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <Panel title="Plan a shift">
        <div className="flex flex-wrap items-end gap-2 p-4">
          <select aria-label="Who" className={SELECT} value={row.staffId || ""} onChange={(e) => setRow({ ...row, staffId: Number(e.target.value) })}>
            <option value="">Who</option>
            {active.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select aria-label="Day" className={SELECT} value={row.day} onChange={(e) => setRow({ ...row, day: e.target.value })}>
            {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((day) => (
              <option key={day} value={day}>
                {new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
              </option>
            ))}
          </select>
          <Input aria-label="Start" type="time" value={row.start} onChange={(e) => setRow({ ...row, start: e.target.value })} className="h-9 w-28" />
          <Input aria-label="End" type="time" value={row.end} onChange={(e) => setRow({ ...row, end: e.target.value })} className="h-9 w-28" />
          <RoleButton need={["network.manage"]} size="sm" variant="outline" disabled={!row.staffId} onClick={() => setDraft(addPlanned(planned, row))}>
            <Plus aria-hidden /> Add
          </RoleButton>
          <RoleButton
            need={["network.manage"]}
            size="sm"
            disabled={busy || draft === null}
            onClick={() =>
              void run(async () => {
                await saveSchedule(branchId, week, planned);
                setDraft(null);
              }, ["schedule"])
            }
          >
            <Save aria-hidden /> Save the week
          </RoleButton>
          {draft !== null ? <span className="text-xs text-muted-foreground">Unsaved changes</span> : null}
        </div>
      </Panel>
      {actuals.data ? (
        <Panel title="Planned against worked">
          <ul className="divide-y divide-border">
            {actuals.data.days.map((d) => (
              <li key={d.day} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                <span className="w-28 font-medium">{new Date(`${d.day}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="tabular-nums text-muted-foreground">
                  planned {d.plannedHours.toFixed(1)} h · worked {d.actualHours.toFixed(1)} h
                </span>
                {d.differenceHours !== 0 ? (
                  <span className="tabular-nums">
                    {d.differenceHours > 0 ? "+" : ""}
                    {d.differenceHours.toFixed(1)} h
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {actuals.data.dayparts?.some((d) => d.hours > 0) ? (
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full text-sm">
                <caption className="sr-only">Labor by daypart</caption>
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-semibold">Daypart</th>
                    <th className="px-4 py-2 text-right font-semibold">Worked</th>
                    <th className="px-4 py-2 text-right font-semibold">Labor</th>
                    <th className="px-4 py-2 text-right font-semibold">Sales</th>
                    <th className="px-4 py-2 text-right font-semibold">Labor %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {actuals.data.dayparts.map((d) => (
                    <tr key={d.key}>
                      <td className="px-4 py-2">
                        <span className="font-medium">{d.label}</span> <span className="text-muted-foreground">{d.hoursRange}</span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{d.hours.toFixed(1)} h</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(d.cost)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(d.netSales)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {d.high ? <Badge variant="destructive">{pct(d.laborShare)}</Badge> : pct(d.laborShare)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {actuals.data.people.length ? (
            <ul className="flex flex-wrap gap-2 border-t border-border p-4 text-sm">
              {actuals.data.people.map((p) => (
                <li key={p.staffId} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                  {p.name} <span className="tabular-nums">{p.hours.toFixed(1)} h</span>
                  {p.state !== "ok" ? <Badge variant={p.state === "over" ? "destructive" : "secondary"}>{OVERTIME_LABELS[p.state]}</Badge> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      ) : null}
      <FormError message={error} />
    </div>
  );
}

// ── inventory ────────────────────────────────────────────────────────────────

function InventoryTab({ branchId, isHq }: { branchId: number; isHq: boolean }) {
  const items = useApiQuery(restaurantQueries.ingredients());
  const variance = useApiQuery(restaurantQueries.foodCost(branchId));
  const inventory = useApiQuery(restaurantQueries.branchInventory(branchId));
  const prices = useApiQuery(restaurantQueries.prices());
  const [waste, setWaste] = useState({ itemId: 0, quantity: "", reason: "dropped" as WasteReason, day: today() });
  const { busy, error, run } = useRun();
  const [count, setCount] = useState<Record<number, string>>({});
  const [countDay, setCountDay] = useState(today());
  const [delivery, setDelivery] = useState({ itemId: 0, quantity: "", unitCost: "", supplier: "", day: today() });
  const [newItem, setNewItem] = useState({ name: "", unit: "kg" as Ingredient["unit"], unitCost: "" });

  if (items.isError) return <QueryErrorState error={items.error} onRetry={() => void items.refetch()} />;
  if (!items.data || !variance.data || !inventory.data) return <RestaurantSkeleton tiles={3} />;
  const active = items.data.filter((i) => i.active);
  const v = variance.data;
  const refreshKeys = ["food-cost", "branch-inventory"];

  return (
    <div className="space-y-4">
      {v.ready ? (
        <Panel title={`Food cost · ${v.opening.countedOn} → ${v.closing.countedOn}`}>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Actual</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(v.actual)} <span className="text-sm text-muted-foreground">{pct(v.actualShare)}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Theoretical (recipes)</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(v.theoretical)} <span className="text-sm text-muted-foreground">{pct(v.theoreticalShare)}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Variance</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(v.variance)} <span className="text-sm text-muted-foreground">{pct(v.varianceShare)}</span>
              </p>
            </div>
          </div>
          {v.waste !== undefined ? (
            <p className="px-4 pb-2 text-sm text-muted-foreground">
              Logged waste {formatCurrency(v.waste)} · unexplained {formatCurrency(v.unexplained ?? 0)}
            </p>
          ) : null}
          {v.countProblems.length ? (
            <p className="px-4 pb-2 text-sm text-destructive">Check the counts of: {v.countProblems.join(", ")} (more on the shelf than came in).</p>
          ) : null}
          <ul className="divide-y divide-border border-t border-border">
            {v.items.slice(0, 10).map((item) => (
              <li key={item.itemId} className="flex justify-between gap-3 px-4 py-2 text-sm">
                <span>{item.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {item.used} {item.unit} × {formatCurrency(item.unitCost)} = {formatCurrency(item.cost)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <EmptyPanel title="No food cost yet" body={v.message} />
      )}
      <Panel title="Count the stock">
        {active.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Head office adds the ingredients first.</p>
        ) : (
          <div className="space-y-3 p-4">
            <div className="flex items-end gap-2">
              <Label htmlFor="count-day" className="text-xs text-muted-foreground">
                Counted on
              </Label>
              <Input id="count-day" type="date" value={countDay} onChange={(e) => setCountDay(e.target.value)} className="h-9 w-[160px]" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((item) => (
                <label key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {item.name} <span className="text-muted-foreground">({item.unit})</span>
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={count[item.id] ?? ""}
                    onChange={(e) => setCount({ ...count, [item.id]: e.target.value })}
                    className="h-8 w-24"
                  />
                </label>
              ))}
            </div>
            <RoleButton
              need={["network.manage"]}
              size="sm"
              disabled={busy || Object.values(count).every((value) => value === "")}
              onClick={() =>
                void run(async () => {
                  const lines = Object.entries(count)
                    .filter(([, value]) => value !== "")
                    .map(([id, value]) => ({ itemId: Number(id), quantity: Number(value) }));
                  await recordCount(branchId, countDay, lines);
                  setCount({});
                }, refreshKeys)
              }
            >
              <Save aria-hidden /> Save the count
            </RoleButton>
          </div>
        )}
      </Panel>
      <Panel title="Waste log">
        <div className="flex flex-wrap items-end gap-2 p-4">
          <select aria-label="Ingredient wasted" className={SELECT} value={waste.itemId || ""} onChange={(e) => setWaste({ ...waste, itemId: Number(e.target.value) })}>
            <option value="">Ingredient</option>
            {active.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Input aria-label="Quantity wasted" placeholder="Quantity" type="number" min={0} step="0.01" value={waste.quantity} onChange={(e) => setWaste({ ...waste, quantity: e.target.value })} className="h-9 w-28" />
          <select aria-label="Reason" className={SELECT} value={waste.reason} onChange={(e) => setWaste({ ...waste, reason: e.target.value as WasteReason })}>
            {(Object.keys(WASTE_REASON_LABELS) as WasteReason[]).map((reason) => (
              <option key={reason} value={reason}>
                {WASTE_REASON_LABELS[reason]}
              </option>
            ))}
          </select>
          <Input aria-label="Logged on" type="date" value={waste.day} onChange={(e) => setWaste({ ...waste, day: e.target.value })} className="h-9 w-[160px]" />
          <RoleButton
            need={["network.manage"]}
            size="sm"
            disabled={busy || !waste.itemId || !Number(waste.quantity)}
            onClick={() =>
              void run(async () => {
                await logWaste(branchId, waste.day, waste.itemId, Number(waste.quantity), waste.reason);
                setWaste({ ...waste, itemId: 0, quantity: "" });
              }, refreshKeys)
            }
          >
            <Plus aria-hidden /> Log it
          </RoleButton>
        </div>
        {inventory.data.waste?.length ? (
          <ul className="divide-y divide-border border-t border-border">
            {inventory.data.waste.slice(0, 8).map((w) => (
              <li key={w.id} className="flex justify-between gap-3 px-4 py-2 text-sm">
                <span>
                  {items.data.find((i) => i.id === w.itemId)?.name ?? "Ingredient"} · {w.quantity} · {WASTE_REASON_LABELS[w.reason as WasteReason] ?? w.reason}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {w.loggedOn} · {formatCurrency(w.cost)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>
      {prices.data && prices.data.items.length ? (
        <Panel title="Supplier prices · last 90 days">
          <ul className="divide-y divide-border">
            {prices.data.items.map((p) => (
              <li key={p.itemId} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                <span className="flex-1">{p.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(p.latest)} / {p.unit} against {formatCurrency(p.baseline)}
                </span>
                <span className="tabular-nums">{p.change === null ? "—" : `${p.change > 0 ? "+" : ""}${pct(p.change)}`}</span>
                {p.flagged ? <Badge variant="secondary">Price up</Badge> : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <Panel title="A delivery came in">
        <div className="flex flex-wrap items-end gap-2 p-4">
          <select aria-label="Ingredient" className={SELECT} value={delivery.itemId || ""} onChange={(e) => setDelivery({ ...delivery, itemId: Number(e.target.value) })}>
            <option value="">Ingredient</option>
            {active.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Input aria-label="Quantity" placeholder="Quantity" type="number" min={0} step="0.01" value={delivery.quantity} onChange={(e) => setDelivery({ ...delivery, quantity: e.target.value })} className="h-9 w-28" />
          <Input aria-label="Unit cost (optional)" placeholder="Unit cost" type="number" min={0} step="0.0001" value={delivery.unitCost} onChange={(e) => setDelivery({ ...delivery, unitCost: e.target.value })} className="h-9 w-28" />
          <Input aria-label="Supplier (optional)" placeholder="Supplier" value={delivery.supplier} onChange={(e) => setDelivery({ ...delivery, supplier: e.target.value })} className="h-9 w-36" />
          <Input aria-label="Received on" type="date" value={delivery.day} onChange={(e) => setDelivery({ ...delivery, day: e.target.value })} className="h-9 w-[160px]" />
          <RoleButton
            need={["network.manage"]}
            size="sm"
            disabled={busy || !delivery.itemId || !Number(delivery.quantity)}
            onClick={() =>
              void run(async () => {
                await recordDelivery(branchId, delivery.day, delivery.supplier.trim() || null, [
                  { itemId: delivery.itemId, quantity: Number(delivery.quantity), unitCost: delivery.unitCost ? Number(delivery.unitCost) : null },
                ]);
                setDelivery({ ...delivery, itemId: 0, quantity: "", unitCost: "" });
              }, refreshKeys)
            }
          >
            <Truck aria-hidden /> Save the delivery
          </RoleButton>
        </div>
      </Panel>
      {isHq ? (
        <Panel title="Ingredients" count={String(items.data.length)}>
          <div className="flex flex-wrap items-end gap-2 p-4">
            <Input aria-label="Ingredient name" placeholder="Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="h-9 w-40" />
            <select aria-label="Unit" className={SELECT} value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as Ingredient["unit"] })}>
              {(["kg", "lb", "l", "each", "case"] as const).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <Input aria-label="Cost per unit" placeholder="Cost / unit" type="number" min={0} step="0.0001" value={newItem.unitCost} onChange={(e) => setNewItem({ ...newItem, unitCost: e.target.value })} className="h-9 w-28" />
            <RoleButton
              need={["network.manage"]}
              size="sm"
              disabled={busy || !newItem.name.trim() || newItem.unitCost === ""}
              onClick={() =>
                void run(async () => {
                  await addIngredient({ name: newItem.name.trim(), unit: newItem.unit, unitCost: Number(newItem.unitCost), category: null });
                  setNewItem({ name: "", unit: "kg", unitCost: "" });
                }, ["ingredients"])
              }
            >
              <Plus aria-hidden /> Add
            </RoleButton>
          </div>
          <ul className="divide-y divide-border border-t border-border">
            {items.data.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 px-4 py-2 text-sm">
                <span>{item.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(item.unitCost)} / {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <FormError message={error} />
    </div>
  );
}

/** The back office (SPEC-394 over backend SPEC-414/415). */
export function BackOfficeView({ tab }: { tab: BackOfficeTab }) {
  const setup = useApiQuery(restaurantQueries.setup());
  const branches = useApiQuery(restaurantQueries.branches({ status: "open" }));
  const [picked, setPicked] = useState<number | null>(null);
  if (branches.isError) return <QueryErrorState error={branches.error} onRetry={() => void branches.refetch()} />;
  if (!branches.data) return <RestaurantSkeleton tiles={2} />;
  if (branches.data.length === 0) return <EmptyPanel title="No branches" body="Add a branch under Network first." />;
  const branchId = picked ?? branches.data[0].id;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <Label htmlFor="bo-branch" className="text-xs text-muted-foreground">
          Branch
        </Label>
        <select id="bo-branch" className={SELECT} value={branchId} onChange={(e) => setPicked(Number(e.target.value))}>
          {branches.data.map((b) => (
            <option key={b.id} value={b.id}>
              #{b.code} {b.name}
            </option>
          ))}
        </select>
      </div>
      {tab === "clock" ? <ClockTab key={branchId} branchId={branchId} /> : null}
      {tab === "schedule" ? <ScheduleTab key={branchId} branchId={branchId} /> : null}
      {tab === "inventory" ? <InventoryTab key={branchId} branchId={branchId} isHq={setup.data?.scope.isHq ?? false} /> : null}
    </div>
  );
}
