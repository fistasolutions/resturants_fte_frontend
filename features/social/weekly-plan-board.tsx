"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CalendarCheck, CalendarDays, CheckCircle2, ChevronRight, Loader2, Plus, RefreshCw } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import { slotState, todayISO } from "@/lib/weekly-plan-status";
import {
  buildPlanBoard,
  appendSlotToPlan,
  genAllProgressLabel,
  initGenAll,
  finishGenAll,
  mergeSlotIntoPlan,
  recordGenAll,
  slotIsGenerated,
  ungeneratedSlots,
  type AddSlotChannel,
  type GenAllProgress,
} from "@/lib/social-plan";
import { plannedDraftToPostDetail } from "@/lib/social-post";
import { addPlanSlot, generatePlanSlot } from "@/services/social-actions";
import type { PlanSlot, PostDetail, WeeklyPlan } from "@/types/social";
import { formatDate } from "@/utils/format";

import { AddSlotDialog } from "./add-slot-dialog";
import { EditorialThumb } from "./editorial-thumb";
import { ChannelBadge, ReasonChip } from "./social-pills";
import { GlispIcon } from "@/components/shared/glisp-icon";

const GENERIC_SLOT_ERROR = "Couldn't generate this draft — try again.";

/* ── One slot card ────────────────────────────────────────────────────────── */

function SlotCard({
  slot,
  today,
  busy,
  error,
  onGenerate,
  onOpen,
}: {
  /** The viewer's local day — a slot whose date has passed is a different thing
   * from one still ahead, and the board used to render them identically. */
  today: string;
  slot: PlanSlot;
  busy: boolean;
  error: string | null;
  onGenerate: () => void;
  /** Open the generated draft's detail (generated slots only). */
  onOpen: () => void;
}) {
  const generated = slotIsGenerated(slot);

  const meta = (
    <>
      <div className="flex items-start gap-3">
        <EditorialThumb
          name={slot.productName}
          postId={slot.postId}
          imageUrl={slot.imageUrl}
          className="size-14 shrink-0 object-cover"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="line-clamp-2 text-sm font-medium text-foreground">
            {slot.productName}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ChannelBadge channel={slot.channel} />
            {slot.occasion && (
              <span className="inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl bg-secondary px-2 text-[0.6875rem] font-medium whitespace-nowrap text-secondary-foreground">
                <CalendarDays className="size-3" aria-hidden />
                {slot.occasion}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
        <p className="text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
          Campaign
        </p>
        <p className="text-sm font-semibold text-foreground">{slot.campaignName}</p>
      </div>

      {slot.rationale && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Why this product: </span>
          {slot.rationale}
        </p>
      )}

      {slot.reason && (
        <div className="flex flex-col gap-1">
          <ReasonChip reason={slot.reason} />
          {slot.reasonDetail && (
            <p className="text-[0.6875rem] text-muted-foreground">{slot.reasonDetail}</p>
          )}
        </div>
      )}
    </>
  );

  const state = slotState(slot, today);

  // A generated slot is a single button that opens its post detail.
  if (generated) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${slot.productName} draft`}
        className="flex w-full flex-col gap-2.5 rounded-card border border-border bg-card p-3 text-left transition-colors outline-none hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {meta}
        {/* SPEC-174 — the board used to promise "auto-schedules Aug 26" on Aug 28.
            A day that has passed with nothing posted is missed, and says so. */}
        <span
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5",
            state === "posted"
              ? "border-success/30 bg-success/10"
              : state === "missed"
                ? "border-warning/30 bg-warning/10"
                : "border-border bg-muted/50",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium",
              state === "posted"
                ? "text-success"
                : state === "missed"
                  ? "text-warning"
                  : "text-muted-foreground",
            )}
          >
            {state === "posted" ? (
              <>
                <CheckCircle2 className="size-3.5" aria-hidden />
                Posted
              </>
            ) : state === "missed" ? (
              <>
                <AlertTriangle className="size-3.5" aria-hidden />
                Missed {formatDate(slot.scheduledDate)} — not posted
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" aria-hidden />
                Ready · scheduled {formatDate(slot.scheduledDate)}
              </>
            )}
          </span>
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-border bg-card p-3">
      {meta}
      <RoleButton need="social.manage" size="sm" className="w-full" onClick={onGenerate} disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Generating…
          </>
        ) : (
          <>
            <GlispIcon className="size-3.5" aria-hidden />
            Generate
          </>
        )}
      </RoleButton>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── The controlled board (SPEC-138) ─────────────────────────────────────────
 * Renders a already-loaded plan (the panel owns loading/history/building). Per-
 * slot + "Generate all" produce the drafts; a single Generate auto-opens the new
 * post's detail via `onOpenDetail`; every mutation reports the fresh plan up via
 * `onPlanMutated` so history counts stay in sync. */
export function WeeklyPlanBoard({
  plan: initialPlan,
  onOpenDetail,
  onPlanMutated,
  onRegenerate,
}: {
  plan: WeeklyPlan;
  onOpenDetail: (postId: string, initial?: PostDetail) => void;
  onPlanMutated: (plan: WeeklyPlan) => void;
  onRegenerate: () => void;
}) {
  // The board owns its working copy; the panel keys it on plan.id so switching
  // plans remounts with fresh state.
  const [plan, setPlan] = useState<WeeklyPlan>(initialPlan);
  const [busySlots, setBusySlots] = useState<ReadonlySet<number>>(new Set());
  const [slotErrors, setSlotErrors] = useState<ReadonlyMap<number, string>>(new Map());
  const [genAll, setGenAll] = useState<GenAllProgress | null>(null);
  // The board day (bare "YYYY-MM-DD") whose "+ Add post" picker is open, else null.
  const [addDayISO, setAddDayISO] = useState<string | null>(null);
  const today = todayISO();
  const boardRef = useRef<HTMLDivElement>(null);
  const can = useCan();
  const addGate = can("social.manage");

  // SPEC-174 — scroll the week to today on mount. The board starts on Sunday, so
  // by Friday the only days you can still act on were off-screen to the right.
  // `behavior: "instant"` on purpose: this is a starting position, not an
  // entrance animation (root Rule 9).
  useEffect(() => {
    const container = boardRef.current;
    const column = container?.querySelector<HTMLElement>('[data-today="true"]');
    if (!container || !column) return;
    container.scrollTo({ left: column.offsetLeft - container.offsetLeft, behavior: "instant" });
  }, [today]);

  const markBusy = useCallback((slotId: number, busy: boolean) => {
    setBusySlots((prev) => {
      const next = new Set(prev);
      if (busy) next.add(slotId);
      else next.delete(slotId);
      return next;
    });
  }, []);

  /** Generate one slot's draft. On success updates the plan, reports it up, and
   * (when `autoOpen`) opens the fresh post's detail. Returns whether it succeeded
   * so "Generate all" can tally without opening anything. */
  const applySlotResult = useCallback(
    async (slot: PlanSlot, autoOpen: boolean): Promise<boolean> => {
      markBusy(slot.slotId, true);
      setSlotErrors((prev) => {
        if (!prev.has(slot.slotId)) return prev;
        const next = new Map(prev);
        next.delete(slot.slotId);
        return next;
      });
      try {
        const res = await generatePlanSlot(slot.slotId);
        setPlan((prev) => {
          const next = mergeSlotIntoPlan(prev, res.slot);
          onPlanMutated(next);
          return next;
        });
        if (autoOpen) {
          onOpenDetail(res.post.postId, plannedDraftToPostDetail(res, res.slot));
        }
        return true;
      } catch (e) {
        setSlotErrors((prev) =>
          new Map(prev).set(
            slot.slotId,
            e instanceof Error ? e.message : GENERIC_SLOT_ERROR,
          ),
        );
        return false;
      } finally {
        markBusy(slot.slotId, false);
      }
    },
    [markBusy, onOpenDetail, onPlanMutated],
  );

  const generatingAll = genAll?.running ?? false;

  async function handleGenerateAll() {
    if (generatingAll) return;
    const pending = ungeneratedSlots(plan);
    if (pending.length === 0) return;
    let progress = initGenAll(pending.length);
    setGenAll(progress);
    for (const slot of pending) {
      // Sequential + resilient: one failure never aborts the rest. No auto-open
      // for the bulk path.
      const ok = await applySlotResult(slot, false);
      progress = recordGenAll(progress, ok);
      setGenAll(progress);
    }
    setGenAll(finishGenAll(progress));
  }

  /** Add a manually-picked product to the open day. Rejects on failure so the
   * dialog surfaces the error; on success merges the new slot + reports up +
   * closes the picker. The new slot is ungenerated, so it renders with Generate. */
  const handleAddSlot = useCallback(
    async (productId: string, channel: AddSlotChannel) => {
      if (!addDayISO) return;
      const newSlot = await addPlanSlot(plan.id, productId, channel, addDayISO);
      setPlan((prev) => {
        const next = appendSlotToPlan(prev, newSlot);
        onPlanMutated(next);
        return next;
      });
      setAddDayISO(null);
    },
    [addDayISO, plan.id, onPlanMutated],
  );

  const board = buildPlanBoard(plan);
  const pendingCount = ungeneratedSlots(plan).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">{plan.title}</h3>
          <p className="text-sm text-muted-foreground">
            Week of {formatDate(plan.weekStart)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RoleButton
            need="social.manage"
            onClick={handleGenerateAll}
            disabled={generatingAll || pendingCount === 0}
          >
            {generatingAll ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <GlispIcon className="size-4" aria-hidden />
                {pendingCount > 0 ? `Generate all (${pendingCount})` : "All generated"}
              </>
            )}
          </RoleButton>
          <RoleButton
            need="social.manage"
            variant="outline"
            onClick={onRegenerate}
            disabled={generatingAll}
          >
            <RefreshCw className="size-4" aria-hidden />
            New plan
          </RoleButton>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-card border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <CalendarCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          Generate a draft for any day to open and review it, then approve it —
          approved posts auto-schedule onto your Calendar for their planned date.
        </p>
      </div>

      {genAll && (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "inline-flex items-center gap-2 text-sm",
            genAll.running ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {genAll.running && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {genAllProgressLabel(genAll)}
        </p>
      )}

      {/* Stacks on mobile; a horizontally-scrolling row of day columns on md+. */}
      <div
        ref={boardRef}
        className="scrollbar-subtle flex flex-col gap-4 md:-mx-1 md:flex-row md:gap-3 md:overflow-x-auto md:px-1 md:pb-3"
      >
        {board.map((day) => {
          const isToday = day.dateISO === today;
          const isPast = day.dateISO < today;
          // A planned day that has gone by with nothing posted. The board used to
          // render five-days-ago identically to next Tuesday, so the days you can
          // still act on looked the same as the ones you can no longer save.
          const dayMissed =
            isPast && day.slots.some((s) => slotState(s, today) === "missed");
          return (
          <section
            key={day.dateISO}
            data-today={isToday ? "true" : undefined}
            className={cn(
              "flex flex-col gap-3 md:w-72 md:shrink-0",
              isPast && !dayMissed && "opacity-60",
            )}
          >
            <header
              className={cn(
                "rounded-lg px-3 py-2",
                isToday
                  ? "bg-primary/10 ring-1 ring-primary/30"
                  : dayMissed
                    ? "bg-warning/10"
                    : "bg-muted/40",
              )}
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {day.weekday}
                {isToday && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.625rem] font-medium text-primary-foreground">
                    Today
                  </span>
                )}
                {dayMissed && (
                  <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-warning">
                    <AlertTriangle className="size-3" aria-hidden />
                    Missed
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{day.dateLabel}</p>
            </header>
            {day.slots.length === 0 ? (
              <button
                type="button"
                onClick={() => setAddDayISO(day.dateISO)}
                disabled={!addGate.allowed}
                title={addGate.reason ?? undefined}
                aria-label={`Add a post for ${day.weekday} ${day.dateLabel}`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-border px-3 py-6 text-center text-muted-foreground transition-colors outline-none hover:border-primary/50 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60"
              >
                <Plus className="size-4" aria-hidden />
                <span className="text-xs font-medium">Add post</span>
                <span className="text-[0.6875rem]">No post planned</span>
              </button>
            ) : (
              day.slots.map((slot) => (
                <SlotCard
                  key={slot.slotId}
                  slot={slot}
                  today={today}
                  busy={busySlots.has(slot.slotId)}
                  error={slotErrors.get(slot.slotId) ?? null}
                  onGenerate={() => void applySlotResult(slot, true)}
                  onOpen={() =>
                    slot.postId !== null && onOpenDetail(String(slot.postId))
                  }
                />
              ))
            )}
          </section>
          );
        })}
      </div>

      <AddSlotDialog
        open={addDayISO !== null}
        onOpenChange={(open) => {
          if (!open) setAddDayISO(null);
        }}
        dateISO={addDayISO ?? ""}
        onAdd={handleAddSlot}
      />
    </div>
  );
}
