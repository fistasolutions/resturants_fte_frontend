"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  buildWeekGrid,
  type CalendarCell,
  groupPostsByDate,
  initialMonth,
  isDropEligible,
  isPastDay,
  monthTitle,
  readyToSchedule,
  removePost,
  rescheduledPost,
  replacePost,
  scheduledByDateSorted,
  shiftDateISO,
  weekRangeLabel,
  weekStartISO,
} from "@/lib/social-calendar";
import { deletePost, schedulePost } from "@/services/social-actions";
import type { CalendarData, CalendarPost, CalendarPostStatus } from "@/types/social";
import { dateToISO } from "@/utils/date";
import { formatDate } from "@/utils/format";

import { EditorialThumb } from "./editorial-thumb";
import { PostDetail } from "./post-detail";
import { CopyLinkButton, SchedulePopover } from "./schedule-popover";
import { ChannelBadge } from "./social-pills";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type CalendarView = "month" | "week" | "list";

function todayISO(): string {
  return dateToISO(new Date());
}

/** The shared handlers + drag state threaded through the views (SPEC-143). */
interface CalCtx {
  today: string;
  ready: CalendarPost[];
  pending: Set<string>;
  /** The role may schedule (social.publish) / delete (social.manage) — SPEC-358. */
  canSchedule: boolean;
  canDelete: boolean;
  onSchedule: (id: string, date: string | null) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
  draggingId: string | null;
  dragOverDate: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDayDragOver: (e: React.DragEvent, dateISO: string) => void;
  onDayDragLeave: () => void;
  onDayDrop: (e: React.DragEvent, dateISO: string) => void;
}

/* ── Small building blocks ────────────────────────────────────────────── */

function SchedulePill({ status }: { status: CalendarPostStatus }) {
  const meta =
    status === "scheduled"
      ? { label: "Scheduled", cls: "bg-success/10 text-success" }
      : { label: "Ready", cls: "bg-secondary text-secondary-foreground" };
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-4xl px-2 text-[0.6875rem] font-medium",
        meta.cls,
      )}
    >
      {meta.label}
    </span>
  );
}

/** A tiny status colour dot for the compact grid chips (Rule 9 — status tokens). */
function StatusDot({ status }: { status: CalendarPostStatus }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        status === "scheduled" ? "bg-success" : "bg-muted-foreground",
      )}
    />
  );
}

/** Confirm-before-delete dialog, shared by the grid chip and the list/ready rows. */
function DeleteConfirmDialog({
  open,
  onOpenChange,
  productName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{productName}</span> will be
            permanently removed from the calendar. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            <Trash2 className="size-4" aria-hidden />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ── Post presentations ───────────────────────────────────────────────── */

/**
 * A scheduled post inside a grid day cell (SPEC-143). Draggable (native HTML5)
 * to reschedule; the body is a button that opens `PostDetail`; the ⋯ menu is the
 * keyboard/click fallback for Reschedule / Unschedule / Delete.
 */
function CalendarChip({ post, ctx }: { post: CalendarPost; ctx: CalCtx }) {
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pending = ctx.pending.has(post.id);
  const dragging = ctx.draggingId === post.id;

  return (
    <div
      draggable={!pending && ctx.canSchedule}
      onDragStart={(e) => ctx.onDragStart(e, post.id)}
      onDragEnd={ctx.onDragEnd}
      aria-grabbed={dragging}
      className={cn(
        "group/chip flex items-center gap-1 rounded-md border border-border bg-card p-1 transition-colors hover:bg-muted/50",
        pending && "opacity-60",
        dragging && "opacity-40",
      )}
    >
      <button
        type="button"
        onClick={() => ctx.onOpen(post.id)}
        aria-label={`Open ${post.productName}`}
        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <EditorialThumb
          name={post.productName}
          postId={post.id}
          imageUrl={post.imageUrl}
          className="size-6 shrink-0 object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.6875rem] font-medium text-foreground">
            {post.productName}
          </span>
          <span className="mt-0.5 flex items-center gap-1">
            <ChannelBadge channel={post.channel} />
            <StatusDot status={post.status} />
          </span>
        </span>
      </button>

      {/* Actions follow the role (SPEC-358): scheduling is social.publish, delete is
          social.manage; a role with neither gets no menu. */}
      {(ctx.canSchedule || ctx.canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={pending}
              aria-label={`Actions for ${post.productName}`}
              className="shrink-0 opacity-0 focus-visible:opacity-100 group-hover/chip:opacity-100"
            >
              <MoreHorizontal className="size-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ctx.canSchedule && (
              <>
                <DropdownMenuItem
                  onSelect={() => window.setTimeout(() => setMoveOpen(true), 0)}
                >
                  <CalendarClock aria-hidden />
                  Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => ctx.onSchedule(post.id, null)}>
                  <CalendarX aria-hidden />
                  Unschedule
                </DropdownMenuItem>
              </>
            )}
            {ctx.canSchedule && ctx.canDelete && <DropdownMenuSeparator />}
            {ctx.canDelete && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => window.setTimeout(() => setConfirmOpen(true), 0)}
              >
                <Trash2 aria-hidden />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Controlled reschedule picker anchored to a zero-size trigger (keyboard
          fallback for drag). */}
      <SchedulePopover
        open={moveOpen}
        onOpenChange={setMoveOpen}
        productName={post.productName}
        scheduledFor={post.scheduledFor}
        trackedLink={post.trackedLink}
        pending={pending}
        onPick={(date) => ctx.onSchedule(post.id, date)}
        onClear={() => ctx.onSchedule(post.id, null)}
      >
        <span aria-hidden className="sr-only" />
      </SchedulePopover>

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        productName={post.productName}
        onConfirm={() => ctx.onDelete(post.id)}
      />
    </div>
  );
}

/** Fuller row for the ready rail and the list view — draggable, click-to-open,
 * with a schedule/reschedule picker and a delete action (SPEC-143). */
function PostRow({ post, ctx }: { post: CalendarPost; ctx: CalCtx }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pending = ctx.pending.has(post.id);
  const dragging = ctx.draggingId === post.id;

  return (
    <div
      draggable={!pending && ctx.canSchedule}
      onDragStart={(e) => ctx.onDragStart(e, post.id)}
      onDragEnd={ctx.onDragEnd}
      aria-grabbed={dragging}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-border p-3",
        pending && "opacity-60",
        dragging && "opacity-40",
      )}
    >
      <button
        type="button"
        onClick={() => ctx.onOpen(post.id)}
        aria-label={`Open ${post.productName}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <EditorialThumb
          name={post.productName}
          postId={post.id}
          imageUrl={post.imageUrl}
          className="size-11 shrink-0 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{post.productName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <ChannelBadge channel={post.channel} />
            <SchedulePill status={post.status} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {post.pillar} · {post.persona}
          </p>
        </div>
      </button>
      <div className="flex flex-wrap items-center gap-1.5">
        {post.trackedLink && <CopyLinkButton link={post.trackedLink} />}
        <SchedulePopover
          productName={post.productName}
          scheduledFor={post.scheduledFor}
          trackedLink={post.trackedLink}
          pending={pending}
          onPick={(date) => ctx.onSchedule(post.id, date)}
          onClear={() => ctx.onSchedule(post.id, null)}
        >
          <RoleButton
            need="social.publish"
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
          >
            <CalendarPlus className="size-3.5" aria-hidden />
            {post.scheduledFor ? "Reschedule" : "Schedule"}
          </RoleButton>
        </SchedulePopover>
        <RoleGate need="social.manage">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Delete ${post.productName}`}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </RoleGate>
      </div>
      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        productName={post.productName}
        onConfirm={() => ctx.onDelete(post.id)}
      />
    </div>
  );
}

/** The empty-day "add a post" affordance — a subtle trigger that lists the ready
 * rail so a post can be scheduled onto this day by keyboard or click (SPEC-143). */
function AddToDayPopover({ dateISO, ctx }: { dateISO: string; ctx: CalCtx }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Add a post to ${formatDate(dateISO)}`}
          className="group/add flex flex-1 items-center justify-center rounded-md border border-dashed border-transparent text-muted-foreground opacity-0 outline-none transition-colors hover:border-border hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b border-border p-3">
          <p className="text-sm font-medium text-foreground">
            Schedule to {formatDate(dateISO)}
          </p>
          <p className="text-xs text-muted-foreground">
            Pick an approved post to place on this day.
          </p>
        </div>
        {ctx.ready.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            No approved posts are waiting. Generate and approve one first.
          </p>
        ) : (
          <ul className="scrollbar-subtle max-h-64 overflow-y-auto p-1">
            {ctx.ready.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  disabled={ctx.pending.has(post.id)}
                  onClick={() => {
                    ctx.onSchedule(post.id, dateISO);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-60"
                >
                  <EditorialThumb
                    name={post.productName}
                    postId={post.id}
                    imageUrl={post.imageUrl}
                    className="size-8 shrink-0 object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">
                      {post.productName}
                    </span>
                    <span className="mt-0.5 block">
                      <ChannelBadge channel={post.channel} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-start">
            <Link href="/social?tab=content-studio">
              <Plus className="size-3.5" aria-hidden />
              Create new in Content Studio
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Day cell (shared by Month + Week grids) ──────────────────────────── */

function DayCell({
  cell,
  view,
  ctx,
}: {
  cell: CalendarCell;
  view: "month" | "week";
  ctx: CalCtx;
}) {
  const past = isPastDay(cell.dateISO, ctx.today);
  const eligible = isDropEligible(cell.dateISO, ctx.today);
  const isDropTarget = Boolean(ctx.draggingId) && ctx.dragOverDate === cell.dateISO;
  const hasPosts = cell.posts.length > 0;

  const dragHandlers = eligible
    ? {
        onDragOver: (e: React.DragEvent) => ctx.onDayDragOver(e, cell.dateISO),
        onDragLeave: ctx.onDayDragLeave,
        onDrop: (e: React.DragEvent) => ctx.onDayDrop(e, cell.dateISO),
      }
    : undefined;

  const weekdayLabel = WEEKDAYS[new Date(`${cell.dateISO}T00:00:00`).getDay()];

  return (
    <div
      {...dragHandlers}
      aria-current={cell.isToday ? "date" : undefined}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-1.5 transition-colors",
        view === "month" ? "min-h-[6.5rem]" : "min-h-[16rem]",
        cell.inCurrentMonth ? "border-border bg-card" : "border-transparent bg-muted/30",
        past && "bg-muted/30 opacity-60",
        cell.isToday && "ring-1 ring-primary",
        isDropTarget && "border-primary bg-primary/5 ring-1 ring-primary",
      )}
    >
      <div className="flex items-baseline justify-between gap-1 px-0.5">
        {view === "week" && (
          <span className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
            {weekdayLabel}
          </span>
        )}
        <span
          className={cn(
            "text-xs tabular-nums",
            cell.inCurrentMonth ? "text-foreground" : "text-muted-foreground",
            cell.isToday && "font-semibold text-primary",
          )}
        >
          {cell.day}
        </span>
      </div>

      {hasPosts ? (
        <div className="space-y-1">
          {cell.posts.map((post) => (
            <CalendarChip key={post.id} post={post} ctx={ctx} />
          ))}
        </div>
      ) : eligible && ctx.canSchedule ? (
        <AddToDayPopover dateISO={cell.dateISO} ctx={ctx} />
      ) : null}
    </div>
  );
}

/* ── Views ────────────────────────────────────────────────────────────── */

function MonthGrid({
  weeks,
  ctx,
}: {
  weeks: CalendarCell[][];
  ctx: CalCtx;
}) {
  return (
    <div className="scrollbar-subtle overflow-x-auto">
      <div className="min-w-[44rem] space-y-1">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-1 py-1 text-center text-[0.6875rem] font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell) => (
              <DayCell key={cell.dateISO} cell={cell} view="month" ctx={ctx} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekGrid({ cells, ctx }: { cells: CalendarCell[]; ctx: CalCtx }) {
  return (
    <div className="scrollbar-subtle overflow-x-auto">
      <div className="grid min-w-[44rem] grid-cols-7 gap-1">
        {cells.map((cell) => (
          <DayCell key={cell.dateISO} cell={cell} view="week" ctx={ctx} />
        ))}
      </div>
    </div>
  );
}

function ListView({ posts, ctx }: { posts: CalendarPost[]; ctx: CalCtx }) {
  const days = scheduledByDateSorted(posts);
  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nothing scheduled. Schedule a post from the ready rail to see it here.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {days.map((day) => (
        <div key={day.dateISO} className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <CalendarClock className="size-3.5 text-muted-foreground" aria-hidden />
            {formatDate(day.dateISO)}
          </p>
          {day.posts.map((post) => (
            <PostRow key={post.id} post={post} ctx={ctx} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Tab ──────────────────────────────────────────────────────────────── */

export function CalendarTab({ data }: { data: CalendarData }) {
  const router = useRouter();
  const today = todayISO();
  const [posts, setPosts] = useState<CalendarPost[]>(data.posts);
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(() => {
    const m = initialMonth(data.posts, today);
    return `${m.year}-${String(m.month + 1).padStart(2, "0")}-01`;
  });
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const can = useCan();
  const canSchedule = can("social.publish").allowed;
  const canDelete = can("social.manage").allowed;

  const ready = readyToSchedule(posts);
  const scheduledCount = posts.length - ready.length;
  const byDate = groupPostsByDate(posts);

  const [anchorYear, anchorMonth1] = anchor.split("-").map(Number);
  const weeks = buildMonthGrid(anchorYear, anchorMonth1 - 1, byDate, today);
  const weekCells = buildWeekGrid(anchor, byDate, today);

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(anchorYear, anchorMonth1 - 1 + delta, 1));
    setAnchor(d.toISOString().slice(0, 10));
  }
  function shiftWeek(delta: number) {
    setAnchor((a) => shiftDateISO(a, delta * 7));
  }
  function goToday() {
    setAnchor(today);
  }

  function markPending(id: string, on: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function onSchedule(postId: string, date: string | null) {
    const previous = posts.find((p) => p.id === postId);
    if (!previous) return;
    if (previous.scheduledFor === date) return; // no-op (same day / already ready)
    setError(null);
    markPending(postId, true);
    // Optimistic: flip the date/status immediately.
    setPosts((prev) => replacePost(prev, postId, rescheduledPost(previous, date)));
    try {
      const updated = await schedulePost(postId, date);
      setPosts((prev) => replacePost(prev, postId, updated));
    } catch (e) {
      // Roll back only this post so a concurrent edit elsewhere isn't lost.
      setPosts((prev) => replacePost(prev, postId, previous));
      setError(
        e instanceof Error ? e.message : "Couldn't update the schedule. Please try again.",
      );
    } finally {
      markPending(postId, false);
    }
  }

  async function onDelete(postId: string) {
    const removed = posts.find((p) => p.id === postId);
    if (!removed) return;
    setError(null);
    markPending(postId, true);
    setPosts((prev) => removePost(prev, postId));
    if (openId === postId) setOpenId(null);
    try {
      await deletePost(postId);
    } catch (e) {
      // Restore the removed post (order isn't load-bearing — the grid re-buckets).
      setPosts((prev) => [...prev, removed]);
      setError(
        e instanceof Error ? e.message : "Couldn't delete the post. Please try again.",
      );
    } finally {
      markPending(postId, false);
    }
  }

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  }
  function onDragEnd() {
    setDraggingId(null);
    setDragOverDate(null);
  }
  function onDayDragOver(e: React.DragEvent, dateISO: string) {
    if (!isDropEligible(dateISO, today)) return; // past days aren't drop targets
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDate !== dateISO) setDragOverDate(dateISO);
  }
  function onDayDragLeave() {
    setDragOverDate(null);
  }
  function onDayDrop(e: React.DragEvent, dateISO: string) {
    if (!isDropEligible(dateISO, today)) return;
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverDate(null);
    if (id) onSchedule(id, dateISO);
  }

  const ctx: CalCtx = {
    today,
    ready,
    pending,
    canSchedule,
    canDelete,
    onSchedule,
    onDelete,
    onOpen: setOpenId,
    draggingId,
    dragOverDate,
    onDragStart,
    onDragEnd,
    onDayDragOver,
    onDayDragLeave,
    onDayDrop,
  };

  if (posts.length === 0) {
    return (
      <Card className="gap-3 px-6 py-12 text-center">
        <CalendarPlus className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">Nothing scheduled yet.</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Approve posts to schedule them. Generate a post in{" "}
          <span className="font-medium text-foreground">Content Studio</span>, approve it
          in <span className="font-medium text-foreground">Approvals</span>, and it&apos;ll
          land here on your calendar.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/social?tab=content-studio">Open Content Studio</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/social?tab=approvals">Go to Approvals</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-card border border-border bg-muted/40 px-4 py-3 text-sm">
        <span className="font-medium text-foreground">{scheduledCount} scheduled</span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <span className="text-muted-foreground">{ready.length} ready</span>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-card border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem]">
        <Card className="gap-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {view === "list" ? (
                  <CardTitle>Scheduled posts</CardTitle>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={view === "month" ? "Previous month" : "Previous week"}
                      onClick={() => (view === "month" ? shiftMonth(-1) : shiftWeek(-1))}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </Button>
                    <CardTitle className="min-w-[11rem] text-center">
                      {view === "month"
                        ? monthTitle(anchorYear, anchorMonth1 - 1)
                        : weekRangeLabel(weekStartISO(anchor))}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={view === "month" ? "Next month" : "Next week"}
                      onClick={() => (view === "month" ? shiftMonth(1) : shiftWeek(1))}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-1"
                      onClick={goToday}
                    >
                      Today
                    </Button>
                  </>
                )}
              </div>

              <div
                role="group"
                aria-label="Calendar view"
                className="inline-flex gap-1 rounded-lg border border-border p-0.5"
              >
                <Button
                  type="button"
                  variant={view === "month" ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={view === "month"}
                  onClick={() => setView("month")}
                >
                  <LayoutGrid className="size-3.5" aria-hidden />
                  Month
                </Button>
                <Button
                  type="button"
                  variant={view === "week" ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={view === "week"}
                  onClick={() => setView("week")}
                >
                  <CalendarDays className="size-3.5" aria-hidden />
                  Week
                </Button>
                <Button
                  type="button"
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List className="size-3.5" aria-hidden />
                  List
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {view === "month" && <MonthGrid weeks={weeks} ctx={ctx} />}
            {view === "week" && <WeekGrid cells={weekCells} ctx={ctx} />}
            {view === "list" && <ListView posts={posts} ctx={ctx} />}
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Ready to schedule</CardTitle>
            <p className="text-sm text-muted-foreground">
              Approved posts waiting for a date. Drag one onto a day, or use its
              Schedule picker.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {ready.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Every approved post has a date. Approve more in the Approvals tab.
              </div>
            ) : (
              ready.map((post) => <PostRow key={post.id} post={post} ctx={ctx} />)
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={openId !== null}
        onOpenChange={(next) => {
          if (!next) setOpenId(null);
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[90vh] w-full overflow-y-auto sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">Post details</DialogTitle>
          {openId && (
            <PostDetail key={openId} postId={openId} onChanged={() => router.refresh()} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
