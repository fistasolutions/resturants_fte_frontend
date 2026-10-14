"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Circle, CircleAlert, LoaderCircle, Minus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBrandResearch } from "@/features/brand-brain/brand-research-provider";
import { useFirstSync } from "@/features/first-sync/first-sync-provider";
import { SETUP_RETURN_EVENT, clearReturn, readReturn, rememberReturn } from "@/features/workspace/setup-return";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { useApiQuery } from "@/hooks/use-api-query";
import { useHydrated } from "@/hooks/use-hydrated";
import { REVIEW_HREF, stepClock, type ResearchLine } from "@/lib/brand-research";
import { isGuided } from "@/lib/company-switches";
import { integrationName } from "@/lib/disclosure";
import { setupQueries } from "@/lib/queries/setup";
import {
  HUB_OVERVIEW_KEY,
  autoOpen,
  checklist,
  checklistIsStale,
  pollInterval,
  returnDecision,
  seenOf,
  shouldWatch,
  toSyncFacts,
  type ChecklistLine,
  type ReturnMemory,
  type Seen,
} from "@/lib/setup-checklist";
import {
  milestones,
  researchSection,
  setupProgress,
  storeSection,
  type BrandSection,
  type StoreSection,
} from "@/lib/setup-sections";
import { cn } from "@/lib/utils";

function subscribeReturn(onChange: () => void): () => void {
  window.addEventListener(SETUP_RETURN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SETUP_RETURN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The tab's return memory, kept in step with sessionStorage (null on the server). */
function useReturnMemory(): ReturnMemory | null {
  const raw = useSyncExternalStore(
    subscribeReturn,
    () => {
      const memory = readReturn();
      return memory ? JSON.stringify(memory) : null;
    },
    () => null,
  );
  return useMemo(() => (raw ? (JSON.parse(raw) as ReturnMemory) : null), [raw]);
}

/**
 * The setup checklist at the top right of every page (SPEC-360; SPEC-361; SPEC-362).
 *
 * Three sections under one progress bar: **Your store** (the first sync's steps, the running one
 * saying what it loads), **Your brand** (the Brand Brain research, live, then Review), and
 * **Your apps** (below).
 *
 * It lists what the company switched on that still needs an integration. Each line is to do,
 * syncing (the app is connected and its first sync is running — a moving bar), done, or failed.
 * It opens by itself when a line appears or moves on, highlighting that line. When the person
 * connected an app from it, it brings them back to the page the step was for as soon as that
 * app has synced. It reads the sync facts only while something is syncing or being connected,
 * and refreshes the workspace when a connection lands, so nothing needs a reload.
 */
export function SetupChecklist() {
  const { visibility } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const [, startRefresh] = useTransition();
  const memory = useReturnMemory();
  const returning = memory !== null;

  const sync = useApiQuery(setupQueries.sync(), {
    enabled: shouldWatch(visibility, returning),
    refetchInterval: (query) =>
      pollInterval(checklist(visibility, toSyncFacts(query.state.data ?? [])), returning),
  });
  const facts = useMemo(() => toSyncFacts(sync.data ?? []), [sync.data]);
  const list = useMemo(() => checklist(visibility, facts), [visibility, facts]);
  // SPEC-362: the store's first sync and the brand research, for a guided organization only —
  // a full one (FOC) keeps its two toasts.
  const guided = isGuided(visibility);
  const firstSync = useFirstSync();
  const research = useBrandResearch();
  const store = useMemo(() => (guided ? storeSection(firstSync.payload) : null), [guided, firstSync.payload]);
  const brand = useMemo(() => (guided ? researchSection(research.run, store) : null), [guided, research.run, store]);
  const progress = setupProgress(store, brand, list);
  // The next thing to connect — the first app that isn't done or already syncing (SPEC-360 UI).
  const nextLine = list?.lines.find((l) => l.state !== "done" && l.state !== "syncing") ?? null;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [seen, setSeen] = useState<Seen | null>(null);
  const [finished, setFinished] = useState<string | null>(null);
  const [goTo, setGoTo] = useState<string | null>(null);

  // Open by itself when a line appears or moves on (adjusting state while rendering, not in an
  // effect). Before hydration nothing is judged; on the first client render only a connection
  // under way counts as news, so a reload never reopens Setup for old steps.
  const current = seenOf(list, milestones(store, brand));
  const signature = JSON.stringify(current);
  if (hydrated && (seen === null || JSON.stringify(seen) !== signature)) {
    // A store still loading is news on the first render too: the company just connected it.
    const previous = seen ?? (returning || store?.state === "running" ? {} : null);
    const next = autoOpen(previous, current);
    setSeen(current);
    if (next.open) {
      setOpen(true);
      setHighlight(next.highlight);
    }
  }

  // Back to the page the step was for once its app has synced; stay put when the first sync
  // failed (the line says why).
  const decision = hydrated ? returnDecision(memory, list, visibility) : null;
  if (memory && decision === "back" && goTo !== memory.href) {
    setGoTo(memory.href);
    setFinished(`${integrationName(memory.integration)} is connected and synced. ${memory.label} is ready.`);
  }

  useEffect(() => {
    if (decision === "stop") clearReturn();
  }, [decision]);

  useEffect(() => {
    if (!goTo) return;
    clearReturn();
    router.push(goTo);
  }, [goTo, router]);

  useEffect(() => {
    if (!finished) return;
    const timer = window.setTimeout(() => setFinished(null), 6_000);
    return () => window.clearTimeout(timer);
  }, [finished]);

  // A connection the workspace doesn't know yet — from Setup's own read or the hub's — refreshes
  // the workspace, so the step and the sidebar follow at once.
  const rows = sync.data;
  useEffect(() => {
    if (rows && checklistIsStale(visibility, rows)) startRefresh(() => router.refresh());
  }, [rows, visibility, router]);
  useEffect(() => {
    const key = JSON.stringify(HUB_OVERVIEW_KEY);
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return;
      if (JSON.stringify(event.query.queryKey) !== key) return;
      const overview = event.query.state.data as { integrations?: { key: string; connected: boolean }[] } | undefined;
      if (overview?.integrations && checklistIsStale(visibility, overview.integrations)) {
        startRefresh(() => router.refresh());
      }
    });
  }, [queryClient, router, visibility]);

  if (!progress.open) {
    return finished ? (
      <div className="flex justify-end px-4 pt-3 md:px-6">
        <p role="status" className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs">
          <CheckCircle2 className="size-4 text-success" aria-hidden />
          {finished}
        </p>
      </div>
    ) : null;
  }

  const syncing =
    store?.state === "running" || brand?.state === "running" || (list?.lines.some((l) => l.state === "syncing") ?? false);
  return (
    <div className="flex justify-end px-4 pt-3 md:px-6">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setHighlight(null);
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" aria-label={`Setup: ${progress.done} of ${progress.total} done`}>
            {syncing ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <SetupRing percent={progress.percent} className="size-6" strokeWidth={13} label={`${progress.percent}% set up`} />
            )}
            <span>Setup</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {progress.done} of {progress.total}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
          <div className="space-y-3 border-b p-4">
            <div className="flex items-center gap-4">
              <SetupRing percent={progress.percent} className="size-16" strokeWidth={9} label={`${progress.percent}% set up`}>
                <span className="text-base leading-none font-bold tabular-nums text-foreground">{progress.percent}%</span>
                <span className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                  {progress.done} of {progress.total}
                </span>
              </SetupRing>
              <div className="min-w-0 flex-1">
                {nextLine ? (
                  <>
                    <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Next step</p>
                    <div className="mt-1.5">
                      <NextStepCard line={nextLine} onClose={() => setOpen(false)} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-medium">{syncing ? "Setting things up…" : "You’re all set."}</p>
                )}
                <SetupDots done={progress.done} total={progress.total} />
              </div>
            </div>
            {finished ? (
              <p role="status" className="flex items-center gap-1.5 text-xs text-success">
                <CheckCircle2 className="size-3.5" aria-hidden />
                {finished}
              </p>
            ) : null}
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {store ? (
              <StoreBlock store={store} highlighted={highlight === "store"} onRetry={() => void firstSync.retry()} />
            ) : null}
            {brand ? (
              <BrandBlock
                brand={brand}
                highlighted={highlight === "brand"}
                onReview={() => {
                  research.close();
                  setOpen(false);
                }}
              />
            ) : null}
            {list ? (
              <section aria-label="Your apps" className="border-t first:border-t-0">
                {store || brand ? <SectionTitle>Your apps</SectionTitle> : null}
                <ul className="space-y-1 p-2">
                  {list.lines.map((line) => (
                    <li key={line.key}>
                      <SetupLine line={line} highlighted={highlight === line.key} onClose={() => setOpen(false)} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</p>;
}

/** A stroke-drawn progress ring in tokens — the badge's mark and the panel's dial. The arc is
 * green (done); its centre is whatever the caller passes. */
function SetupRing({
  percent,
  className,
  strokeWidth = 9,
  label,
  children,
}: {
  percent: number;
  className?: string;
  strokeWidth?: number;
  label: string;
  children?: React.ReactNode;
}) {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={cn("relative shrink-0", className)}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={label}>
        <circle cx="50" cy="50" r={radius} className="fill-none stroke-muted" strokeWidth={strokeWidth} />
        {percent > 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="fill-none stroke-current text-success"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
          />
        ) : null}
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">{children}</div>
      ) : null}
    </div>
  );
}

/** The next app to connect, as a card in the panel header — the same navigation as its row in
 * the list (remember where to come back to, then go). */
function NextStepCard({ line, onClose }: { line: ChecklistLine; onClose: () => void }) {
  const failed = line.state === "failed";
  const mark = (integrationName(line.integration) || line.label.replace(/^Connect\s+/i, "")).trim().charAt(0).toUpperCase() || "+";
  return (
    <Link
      href={line.href}
      onClick={() => {
        rememberReturn({ key: line.key, integration: line.integration, href: line.returnTo, label: line.returnLabel });
        onClose();
      }}
      className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-sm font-semibold text-foreground">{mark}</span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-semibold", failed && "text-destructive")}>{line.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{line.detail}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/** One dot per step: done (green), the next one (brand primary), the rest faint. Hidden when
 * there are too many to read at a glance. */
function SetupDots({ done, total }: { done: number; total: number }) {
  if (total < 2 || total > 24) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn("size-1.5 rounded-full", i < done ? "bg-success" : i === done ? "bg-primary" : "bg-muted-foreground/25")}
        />
      ))}
    </div>
  );
}

function StepIcon({ state }: { state: StoreSection["lines"][number]["state"] }) {
  if (state === "done") return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />;
  if (state === "running") return <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-primary" aria-hidden />;
  if (state === "failed") return <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />;
  return <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />;
}

/** Your store: the first sync's steps, the running one saying what it loads (SPEC-362). */
function StoreBlock({ store, highlighted, onRetry }: { store: StoreSection; highlighted: boolean; onRetry: () => void }) {
  return (
    <section aria-label="Your store" className={cn("border-t first:border-t-0", highlighted && "bg-muted/40")}>
      <SectionTitle>Your store</SectionTitle>
      <p className="px-4 pt-1 text-sm font-medium" aria-live="polite">
        {store.title}
      </p>
      <ul className="space-y-1 p-2">
        {store.lines.map((line) => (
          <li key={line.key} className="flex items-start gap-3 rounded-lg px-2 py-1.5">
            <StepIcon state={line.state} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", line.state === "waiting" ? "text-muted-foreground" : "text-foreground", line.state === "running" && "font-medium")}>
                {line.title}
              </p>
              {line.note ? (
                <p className={cn("text-xs", line.state === "failed" ? "text-destructive" : "text-muted-foreground")}>{line.note}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {store.state === "failed" ? (
        <div className="px-4 pb-3">
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/** One research step: its icon, label, clock and what it is doing, or what it found (SPEC-367). */
function ResearchStepLine({ line, now }: { line: ResearchLine; now: number }) {
  const clock = stepClock(line, now);
  const icon =
    line.state === "done" ? (
      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
    ) : line.state === "running" ? (
      <LoaderCircle className="mt-0.5 size-3.5 shrink-0 animate-spin text-ai" aria-hidden />
    ) : line.state === "failed" ? (
      <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
    ) : line.state === "skipped" ? (
      <Minus className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
    ) : (
      <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
    );
  return (
    <li className="flex items-start gap-2 py-1">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "text-xs",
              line.state === "waiting" ? "text-muted-foreground" : "text-foreground",
              line.state === "running" && "font-medium",
            )}
          >
            {line.label}
          </p>
          {clock ? <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{clock}</span> : null}
        </div>
        {line.text ? (
          <p className={cn("text-[11px] leading-snug", line.state === "failed" ? "text-destructive" : "text-muted-foreground")}>
            {line.text}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/** Your brand: the Brand Brain research, every step live, then Review (SPEC-362, SPEC-367). */
function BrandBlock({ brand, highlighted, onReview }: { brand: BrandSection; highlighted: boolean; onReview: () => void }) {
  const running = brand.state === "running";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  const icon = running ? (
    <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-ai" aria-hidden />
  ) : brand.state === "failed" ? (
    <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
  ) : brand.state === "waiting" ? (
    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
  ) : (
    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
  );
  const steps = (
    <ul className="mt-1" aria-label="Research steps">
      {brand.lines.map((line) => (
        <ResearchStepLine key={line.key} line={line} now={now} />
      ))}
    </ul>
  );
  return (
    <section aria-label="Your brand" className={cn("border-t first:border-t-0", highlighted && "bg-muted/40")}>
      <SectionTitle>Your brand</SectionTitle>
      <div className="flex items-start gap-3 px-4 py-2">
        {icon}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn("text-sm font-medium", brand.state === "waiting" && "text-muted-foreground")}>{brand.title}</p>
            {running ? <span className="shrink-0 text-xs font-semibold tabular-nums">{brand.progress}%</span> : null}
          </div>
          {running ? (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={brand.progress} aria-valuemin={0} aria-valuemax={100} aria-label={brand.title}>
              <div className="h-full rounded-full bg-ai" style={{ width: `${brand.progress}%` }} />
            </div>
          ) : null}
          {running ? (
            <>
              {brand.position ? <p className="text-xs text-muted-foreground tabular-nums">{brand.position}</p> : null}
              <div aria-live="polite">{steps}</div>
            </>
          ) : (
            <>
              <p className={cn("text-xs", brand.state === "failed" ? "text-destructive" : "text-muted-foreground")}>{brand.note}</p>
              {brand.canReview ? (
                <Button asChild size="sm" className="mt-1">
                  <Link href={REVIEW_HREF} onClick={onReview}>
                    Review
                    <ChevronRight aria-hidden />
                  </Link>
                </Button>
              ) : null}
              {brand.lines.length ? (
                <details className="group pt-1">
                  <summary className="cursor-pointer list-none rounded text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                    What it did ({brand.lines.length} steps)
                  </summary>
                  {steps}
                </details>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function SetupLine({ line, highlighted, onClose }: { line: ChecklistLine; highlighted: boolean; onClose: () => void }) {
  const frame = cn("flex items-start gap-3 rounded-lg px-2 py-2", highlighted && "bg-muted ring-1 ring-ring/40");
  if (line.state === "done") {
    return (
      <div className={frame}>
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{line.label}</p>
          <p className="text-xs text-muted-foreground">{line.detail}</p>
        </div>
      </div>
    );
  }
  if (line.state === "syncing") {
    return (
      <div className={frame} aria-live="polite">
        <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-medium">{line.label}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={line.label}>
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
          <p className="text-xs text-muted-foreground">{line.detail}</p>
        </div>
      </div>
    );
  }
  const failed = line.state === "failed";
  return (
    <Link
      href={line.href}
      onClick={() => {
        rememberReturn({ key: line.key, integration: line.integration, href: line.returnTo, label: line.returnLabel });
        onClose();
      }}
      className={cn(frame, "outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring")}
    >
      {failed ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", failed && "text-destructive")}>{line.label}</p>
        <p className="text-xs text-muted-foreground">{line.detail}</p>
      </div>
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
