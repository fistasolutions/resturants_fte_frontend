"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import {
  planProgress,
  planStatus,
  planSummary,
  statusMeta,
  todayISO,
} from "@/lib/weekly-plan-status";
import {
  buildWeeklyPlanCrumbs,
  sortPlanSummaries,
  type CrumbTarget,
} from "@/lib/social-plan";
import {
  fetchWeeklyPlanById,
  fetchWeeklyPlans,
  generateWeeklyPlan,
} from "@/services/social-actions";
import type {
  PostDetail,
  WeeklyPlan,
  WeeklyPlanSummary,
} from "@/types/social";
import { formatDate, formatDateTime } from "@/utils/format";

import { PostDetail as PostDetailView } from "./post-detail";
import { WeeklyPlanBoard } from "./weekly-plan-board";
import { GlispIcon } from "@/components/shared/glisp-icon";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BUILD_STAGES = [
  "Reading your Brand Brain and last week's posts",
  "Scanning best-sellers, new drops, and slow movers",
  "Matching products to the week's occasions",
  "Naming campaigns and writing the rationale",
];

/* ── "Building your week's calendar" loader (SPEC-138) ─────────────────────────
 * A full-width 7-day calendar skeleton (a shimmering slot card per day) with the
 * staged planner lines above it — reads as "building your week's calendar", not a
 * plain spinner. CSS-only (`.plan-building-bar` + Skeleton pulse); stills under
 * `prefers-reduced-motion` (Rule 9 — no framer-motion). */
function PlanBuildingCalendar() {
  return (
    <div
      className="space-y-5 rounded-card border border-border bg-card p-5"
      aria-busy
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-ai">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ai/10">
          <GlispIcon className="size-4 animate-pulse" aria-hidden />
        </span>
        <span className="text-sm font-medium">Building your week&apos;s calendar…</span>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2">
        {BUILD_STAGES.map((stage, index) => (
          <li
            key={stage}
            className="flex items-start gap-2 text-xs text-muted-foreground"
          >
            <span
              className="mt-1 size-2 shrink-0 animate-pulse rounded-full bg-ai/70"
              style={{ animationDelay: `${index * 220}ms` }}
              aria-hidden
            />
            {stage}
          </li>
        ))}
      </ol>

      <div className="plan-building-bar" aria-hidden />

      {/* 7-day calendar skeleton: a column of shimmering slot placeholders per day. */}
      <div className="flex flex-col gap-3 md:-mx-1 md:flex-row md:gap-3 md:overflow-x-hidden md:px-1">
        {WEEKDAY_LABELS.map((weekday, index) => (
          <section
            key={weekday}
            className="flex flex-col gap-3 md:w-full md:shrink"
            aria-hidden
          >
            <header className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-sm font-semibold text-muted-foreground">{weekday}</p>
              <Skeleton className="mt-1 h-3 w-10" />
            </header>
            {/* Two shimmering slot cards early in the week, one later — evokes a
                filling calendar without implying real content. */}
            {(index < 3 ? [0, 1] : [0]).map((slot) => (
              <div
                key={slot}
                className="flex flex-col gap-2.5 rounded-card border border-border bg-card p-3"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="size-14 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </section>
        ))}
      </div>

      <span className="sr-only">
        Building your weekly content calendar. This can take up to 30 seconds.
      </span>
    </div>
  );
}

/* ── Breadcrumb ───────────────────────────────────────────────────────────── */

function Breadcrumb({
  planTitle,
  postName,
  onNavigate,
}: {
  planTitle: string | null;
  postName: string | null;
  onNavigate: (target: CrumbTarget) => void;
}) {
  const crumbs = buildWeeklyPlanCrumbs({ planTitle, postName });
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
    >
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="size-3.5" aria-hidden />}
          {crumb.target ? (
            <button
              type="button"
              onClick={() => onNavigate(crumb.target as CrumbTarget)}
              className="transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="max-w-[16rem] truncate font-medium text-foreground">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ── History list ─────────────────────────────────────────────────────────── */

/** The derived status pill (SPEC-174).
 *
 * Replaces two separate code paths that BOTH rendered the word "Active": a
 * hardcoded green pill for the newest plan, and `PostStatusChip` over the stale
 * `status` column for the rest. On 2026-08-28 that made two plans covering the
 * same finished-ish week look equally healthy while nothing had been posted. */
const TONE_CLASS: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
  info: "bg-ai/10 text-ai",
  neutral: "bg-muted text-muted-foreground",
};

function PlanStatusPill({ plan, today }: { plan: WeeklyPlanSummary; today: string }) {
  const meta = statusMeta(planStatus(plan, today));
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl px-2 text-[0.6875rem] font-medium whitespace-nowrap",
        TONE_CLASS[meta.tone],
      )}
    >
      {meta.tone === "success" && <CheckCircle2 className="size-3" aria-hidden />}
      {meta.label}
    </span>
  );
}

function HistoryRow({
  plan,
  today,
  onOpen,
}: {
  plan: WeeklyPlanSummary;
  /** The viewer's local day — status is derived against it, never stored. */
  today: string;
  onOpen: () => void;
}) {
  const status = planStatus(plan, today);
  const governing = status !== "superseded";
  const progress = planProgress(plan);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${plan.title}`}
      aria-current={governing ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-card border bg-card p-4 text-left transition-colors outline-none hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        status === "missed"
          ? "border-destructive/30"
          : governing
            ? "border-success/40"
            : "border-border opacity-70",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          governing ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
        )}
      >
        <CalendarDays className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold text-foreground">{plan.title}</p>
        {/* SPEC-174 — the week leads; "created" is demoted. And the line says what
            went OUT, not what was drafted. */}
        <p className="text-xs text-muted-foreground">
          Week of {formatDate(plan.weekStart)} · {planSummary(plan, today)}
        </p>
        {plan.slotCount > 0 && (
          <div
            className="h-1 w-full max-w-56 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${plan.postedCount} of ${plan.slotCount} posted`}
          >
            <div
              className={cn(
                "h-full rounded-full",
                status === "missed" ? "bg-destructive/50" : "bg-success",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <p className="text-[0.6875rem] text-muted-foreground">
          Created {formatDateTime(plan.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <PlanStatusPill plan={plan} today={today} />
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </div>
    </button>
  );
}

/* ── Panel ────────────────────────────────────────────────────────────────── */

type BoardPhase = "idle" | "loading" | "building" | "error";

/**
 * The navigable Weekly Plans area inside Content Studio (SPEC-138). Owns the
 * history list, breadcrumbs, plan loading, plan generation (with the calendar-
 * building loader), the board, and the per-post detail. Kept mounted (hidden) by
 * the tab so the plan persists across product browsing; a full reload rehydrates
 * history from the server. External interface matches the old board so the tab
 * barely changes. The single "Generate Weekly Plan" entry point lives on the
 * Content Studio tab header (SPEC-142 fix 2), which bumps `generateNonce` to
 * trigger a build here; `onBack` returns to the product browser.
 */
export function WeeklyPlansPanel({
  onBack,
  generateNonce = 0,
}: {
  onBack: () => void;
  /** Incremented by the tab-header "Generate Weekly Plan" button to build a plan. */
  generateNonce?: number;
}) {
  const [plans, setPlans] = useState<WeeklyPlanSummary[] | null>(null);
  // SPEC-174 — status is derived against the VIEWER's local day, so a week that
  // ended an hour ago reads as ended to the person whose week it was.
  const today = todayISO();
  const [plansError, setPlansError] = useState(false);

  const [view, setView] = useState<"history" | "board">("history");
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [boardPhase, setBoardPhase] = useState<BoardPhase>("idle");
  const [boardError, setBoardError] = useState<string | null>(null);

  const [detail, setDetail] = useState<{ postId: string; initial?: PostDetail } | null>(
    null,
  );

  // Building a plan needs social.manage (SPEC-358). The buttons that ask for one are
  // gated where they live; this keeps a build from starting without it.
  const can = useCan();
  const generateGate = can("social.manage");
  const canGenerate = generateGate.allowed;
  const generateBlocked = generateGate.reason;

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetchWeeklyPlans();
      setPlans(sortPlanSummaries(res.plans));
      setPlansError(false);
    } catch {
      setPlansError(true);
      setPlans((prev) => prev ?? []);
    }
  }, []);

  // Hydrate the history once on mount (persists across navigation + reload).
  // The setState lives in the async `.then`/`.catch`, not the effect body.
  useEffect(() => {
    let active = true;
    fetchWeeklyPlans()
      .then((res) => {
        if (!active) return;
        setPlans(sortPlanSummaries(res.plans));
        setPlansError(false);
      })
      .catch(() => {
        if (!active) return;
        setPlansError(true);
        setPlans((prev) => prev ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  const runGenerate = useCallback(async () => {
    setView("board");
    setDetail(null);
    if (!canGenerate) {
      setBoardError(generateBlocked);
      setBoardPhase("error");
      return;
    }
    setBoardPhase("building");
    setBoardError(null);
    try {
      const next = await generateWeeklyPlan();
      setPlan(next);
      setBoardPhase("idle");
      // Re-pull history so the new plan appears in the list.
      void loadPlans();
    } catch (e) {
      setBoardError(
        e instanceof Error
          ? e.message
          : "Couldn't build the plan right now. Please try again.",
      );
      setBoardPhase("error");
    }
  }, [canGenerate, generateBlocked, loadPlans]);

  // The tab-header "Generate Weekly Plan" button bumps `generateNonce`; build a
  // plan whenever it increments (skips the initial 0). `runGenerate` is stable.
  useEffect(() => {
    // Bridge: the parent bumps `generateNonce` as an intentional "build now"
    // signal; `runGenerate` is a stable callback that drives the build state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (generateNonce > 0) void runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateNonce]);

  async function openPlan(id: number) {
    setView("board");
    setDetail(null);
    setBoardPhase("loading");
    setBoardError(null);
    try {
      const loaded = await fetchWeeklyPlanById(id);
      setPlan(loaded);
      setBoardPhase("idle");
    } catch (e) {
      setBoardError(
        e instanceof Error ? e.message : "Couldn't load that plan. Please try again.",
      );
      setBoardPhase("error");
    }
  }

  function goHistory() {
    setDetail(null);
    setView("history");
  }

  /** Keep the open plan + its history row in sync after a slot is generated —
   * derive the generated count locally so no extra round trip is needed. */
  const onPlanMutated = useCallback((next: WeeklyPlan) => {
    setPlan(next);
    const generatedCount = next.slots.filter((s) => s.postId !== null).length;
    setPlans((prev) =>
      prev
        ? prev.map((p) =>
            p.id === next.id ? { ...p, generatedCount, slotCount: next.slots.length } : p,
          )
        : prev,
    );
  }, []);

  const openDetail = useCallback((postId: string, initial?: PostDetail) => {
    setDetail({ postId, initial });
  }, []);

  function navigate(target: CrumbTarget) {
    if (target === "root") onBack();
    else if (target === "history") goHistory();
    else if (target === "board") setDetail(null);
  }

  const planTitle = view === "board" && plan ? plan.title : null;
  const postName = detail?.initial?.productName ?? null;

  return (
    <div className="space-y-4">
      <Breadcrumb
        planTitle={detail ? (plan?.title ?? "Plan") : planTitle}
        postName={detail ? (postName ?? "Post") : null}
        onNavigate={navigate}
      />

      {/* Post detail (opened from a generated slot) takes over the area. */}
      {detail ? (
        <PostDetailView
          key={detail.postId}
          postId={detail.postId}
          initial={detail.initial}
          onBack={() => setDetail(null)}
          onChanged={() => void loadPlans()}
        />
      ) : view === "board" ? (
        boardPhase === "building" ? (
          <PlanBuildingCalendar />
        ) : boardPhase === "loading" ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-56 w-full rounded-card" />
              ))}
            </div>
          </div>
        ) : boardPhase === "error" || !plan ? (
          <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {boardError ?? "We couldn't load your weekly plan."}
            </p>
            <Button className="mt-4" variant="outline" onClick={goHistory}>
              Back to plans
            </Button>
          </div>
        ) : (
          <WeeklyPlanBoard
            key={plan.id}
            plan={plan}
            onOpenDetail={openDetail}
            onPlanMutated={onPlanMutated}
            onRegenerate={runGenerate}
          />
        )
      ) : (
        /* History list */
        <div className="space-y-5">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">Weekly plans</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Every week you&apos;ve planned — open one to generate or review its posts.
              Use <span className="font-medium text-foreground">Generate Weekly Plan</span>{" "}
              above to build a new one.
            </p>
          </div>

          {plansError && (
            <p role="alert" className="text-sm text-destructive">
              We couldn&apos;t load your plans.{" "}
              <button
                type="button"
                onClick={() => void loadPlans()}
                className="font-medium underline"
              >
                Try again
              </button>
              .
            </p>
          )}

          {plans === null ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[4.75rem] w-full rounded-card" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-card border border-dashed border-border bg-card p-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-ai/10 text-ai">
                <CalendarDays className="size-6" aria-hidden />
              </span>
              <p className="mt-4 text-sm font-medium text-foreground">No weekly plans yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Ask the AI to plan your whole week — one post per day, matched to your
                products and the week&apos;s occasions. Use{" "}
                <span className="font-medium text-foreground">Generate Weekly Plan</span>{" "}
                above to start.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((p) => (
                <HistoryRow
                  key={p.id}
                  plan={p}
                  today={today}
                  onOpen={() => void openPlan(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
