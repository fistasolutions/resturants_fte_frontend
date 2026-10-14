"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crosshair, FileText, Info, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DAILY_PICK_SCORE_PARTS,
  DAILY_PICKS_TODAY_VALUE,
  dailyPicksDateOptions,
  draftStatusLabel,
  formatPickScore,
  pickHeadlineScore,
  formatStrikingEvidence,
  isResearchedPick,
  pickModifierNotes,
  pickRankExplanation,
  pickSourceLabel,
  pickSourceTone,
  queryIntentLabel,
} from "@/lib/spotlight";
import type {
  BlogDraft,
  DailyPick,
  DailyPicksHistoryEntry,
  DailyPicksSnapshot,
} from "@/types/spotlight";
import { formatDate, formatDateTime } from "@/utils/format";

import { GenerateDraftButton } from "./generate-draft-button";
import { RefreshPicksButton } from "./refresh-picks-button";
import { SpotlightDraftsCard } from "./spotlight-drafts-card";
import { GlispIcon } from "@/components/shared/glisp-icon";

const pillBase =
  "inline-flex h-5 w-fit shrink-0 items-center rounded-4xl px-2 text-[0.6875rem] font-medium whitespace-nowrap";

/** The date picker (SPEC-163) — a dropdown, not the pill strip it replaces.
 *
 * Snapshots accumulate daily and are never deleted, so one pill per day was
 * already an unusable horizontal scroll within a month. A Select is constant
 * height for any history length and keyboard-navigable for free.
 *
 * Changing the day genuinely needs a different snapshot from the server, so this
 * still navigates (`?date=`) rather than switching client-side — the shareable,
 * back-button-friendly URL is worth keeping. Sub-views, which are only a view
 * change, do switch client-side. */
function DatePicker({
  history,
  activeDate,
  todayDate,
  onNavigate,
  pending,
}: {
  history: DailyPicksHistoryEntry[];
  activeDate: string;
  todayDate: string;
  onNavigate: (href: string) => void;
  pending: boolean;
}) {
  const options = dailyPicksDateOptions(history, todayDate);
  if (options.length <= 1) return null;

  // The sentinel, never "" — Radix reads an empty value as "nothing selected"
  // and renders a blank trigger (SPEC-163 Patch).
  const value =
    activeDate === todayDate ? DAILY_PICKS_TODAY_VALUE : activeDate;
  return (
    <Select
      value={value}
      onValueChange={(next) =>
        onNavigate(
          next === DAILY_PICKS_TODAY_VALUE
            ? "/spotlight?tab=daily-picks"
            : `/spotlight?tab=daily-picks&date=${next}`,
        )
      }
    >
      <SelectTrigger
        className="h-8 w-40"
        aria-label="Choose a day"
        aria-busy={pending}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.value === DAILY_PICKS_TODAY_VALUE
              ? option.label
              : formatDate(option.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** One normalized score component as a labelled bar — the backend owns the
 * number, this only renders it (root Rule 8). */
function ScorePartBar({ label, value }: { label: string; value: number }) {
  const pct = formatPickScore(value);
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[0.6875rem] text-muted-foreground">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-[0.6875rem] tabular-nums text-muted-foreground">
        {pct}
      </span>
    </div>
  );
}

/** A single ranked pick card. */
function PickCard({ pick, rank }: { pick: DailyPick; rank: number }) {
  const modifierNotes = pickModifierNotes(pick.scoreParts);
  const strikingEvidence = formatStrikingEvidence(pick.striking);
  return (
    <article className="rounded-card border border-border p-4 transition-colors hover:bg-muted/40">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold tabular-nums text-primary">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground">{pick.title}</h3>
            <div className="flex shrink-0 items-center gap-1">
              <span
                className={cn(pillBase, "bg-primary/10 text-primary")}
                title="How well this topic fits: demand, striking distance, margin, catalog and brand fit — before today's rotation"
              >
                {pickHeadlineScore(pick)} fit
              </span>
              {pick.scoreParts.freshness < 1 ? (
                <span className={cn(pillBase, "bg-muted text-muted-foreground")} title="Written recently, so it ranks lower today; the fit is unchanged">
                  ranked lower today
                </span>
              ) : null}
              {/* Explains the SCORE, so it sits beside it (SPEC-164). Computed
                  from the parts already on the card — no request, no LLM. */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Why "${pick.title}" ranked #${rank}`}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Info className="size-3.5" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 text-sm">
                  <ul className="space-y-2">
                    {pickRankExplanation(pick.scoreParts, rank, pick.source, pick.striking).map(
                      (line) => (
                        <li key={line} className="text-muted-foreground">
                          {line}
                        </li>
                      ),
                    )}
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {pick.angle ? (
            <p className="mt-1 text-sm text-foreground">{pick.angle}</p>
          ) : null}
          {pick.fills ? (
            <p className="mt-1 text-sm text-muted-foreground">{pick.fills}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {/* Provenance first (SPEC-159): a research guess must never be
                mistaken for measured demand. */}
            <span
              className={cn(pillBase, "gap-1", pickSourceTone(pick.source))}
              title={
                pick.source === "competitor_gap"
                  ? "A topic an approved competitor publishes that you don't — an opportunity, not measured demand"
                  : isResearchedPick(pick.source)
                    ? "Found by the research agent — an opportunity, not measured demand"
                    : pick.source === "search_console"
                      ? "Real Google Search Console demand"
                      : "Generated from your catalog"
              }
            >
              {isResearchedPick(pick.source) ? (
                <GlispIcon className="size-3" aria-hidden />
              ) : null}
              {pickSourceLabel(pick.source, pick.sourceRef)}
            </span>
            <span className={cn(pillBase, "bg-muted text-foreground")}>
              {queryIntentLabel(pick.intent)}
            </span>
            <span className="text-xs text-muted-foreground">{pick.persona}</span>
            {pick.featuredProductIds.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Package className="size-3.5" aria-hidden />
                {pick.featuredProductIds.length}{" "}
                {pick.featuredProductIds.length === 1 ? "product" : "products"}
              </span>
            ) : null}
          </div>

          {/* Score breakdown — why the backend ranked it here. */}
          <div className="mt-3 grid gap-1.5 sm:max-w-md">
            {DAILY_PICK_SCORE_PARTS.map(({ key, label }) => {
              const value = pick.scoreParts[key];
              // `striking` is absent until the backend measured it (SPEC-265) —
              // an unmeasured part draws no bar rather than a misleading 0%.
              if (typeof value !== "number") return null;
              return <ScorePartBar key={key} label={label} value={value} />;
            })}
          </div>

          {/* Striking-distance evidence (backend SPEC-264): the search the store
              already ranks 8–25 for, so the score reads as a reason, not a number. */}
          {strikingEvidence ? (
            <p className="mt-2 inline-flex items-start gap-1.5 text-[0.6875rem] text-muted-foreground">
              <Crosshair className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
              <span>{strikingEvidence}</span>
            </p>
          ) : null}

          {/* Freshness and performance are MULTIPLIERS, not 0–1 components, so
              they are worded rather than drawn as bars (a 1.15 on a 0–100% bar
              would be a lie). Neutral values render nothing. */}
          {modifierNotes.length > 0 ? (
            <ul className="mt-1.5 space-y-0.5">
              {modifierNotes.map((note) => (
                <li key={note} className="text-[0.6875rem] text-muted-foreground">
                  {note}
                </li>
              ))}
            </ul>
          ) : null}

          {pick.rationale ? (
            <p className="mt-3 border-l-2 border-border pl-3 text-sm text-muted-foreground">
              {pick.rationale}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {pick.draftId != null ? (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/spotlight/draft/${pick.draftId}`}>
                    <FileText className="size-3.5" aria-hidden />
                    <span className="whitespace-nowrap">View draft</span>
                  </Link>
                </Button>
                {pick.draftStatus ? (
                  <span className={cn(pillBase, "bg-muted text-muted-foreground")}>
                    {draftStatusLabel(pick.draftStatus)}
                  </span>
                ) : null}
              </>
            ) : (
              <GenerateDraftButton keyword={pick.keyword} label="Write this" />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Daily Picks (SPEC-155): the day's top-10 ranked blog-title picks, with a
 * dated history strip. A server component — the only interactive parts (Write /
 * Refresh) are their own client islands. */
type SubView = "picks" | "drafts";

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: "picks", label: "Picks" },
  { id: "drafts", label: "Drafts" },
];

/** Sub-views inside the tab (SPEC-163). Local state, NOT links: switching
 * between picks and drafts is a view change over data already loaded, so it must
 * be instant with no navigation or flash. Choosing a different day IS a data
 * change and still goes through the URL — see `DatePicker`. */
function SubViewTabs({
  active,
  onChange,
}: {
  active: SubView;
  onChange: (view: SubView) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-0.5">
      {SUB_VIEWS.map((view) => {
        const selected = view.id === active;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(view.id)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}

export function DailyPicksTab({
  snapshot,
  history,
  todayDate,
  drafts,
}: {
  snapshot: DailyPicksSnapshot;
  history: DailyPicksHistoryEntry[];
  todayDate: string;
  drafts: BlogDraft[];
}) {
  const [view, setView] = useState<SubView>("picks");
  // A day change is a real server fetch, but it must NOT tear down the card
  // (SPEC-163 Patch). Inside a transition React keeps the current content
  // mounted — header, sub-tabs, dropdown and all — while the new snapshot
  // streams in; only the list below is dimmed to show work is happening.
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const goToDate = (href: string) =>
    startTransition(() => router.push(href));
  const viewingToday = snapshot.pickDate === todayDate;

  if (view === "drafts") {
    return (
      <div className="space-y-4">
        <SubViewTabs active={view} onChange={setView} />
        <SpotlightDraftsCard drafts={drafts} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SubViewTabs active={view} onChange={setView} />
      <Card className="gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <GlispIcon className="size-4 text-primary" aria-hidden />
              Daily Picks
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              The day&apos;s highest-opportunity blog titles — a research agent
              writes each title over the query-bank clusters, ranked by real
              demand, margin, catalog depth, and brand fit.
            </p>
          </div>
          {/* Date + refresh live together in the header's right corner
              (SPEC-163 Patch) — day selection is a control, not body content. */}
          <div className="flex shrink-0 items-center gap-2">
            <DatePicker
              history={history}
              activeDate={snapshot.pickDate}
              todayDate={todayDate}
              onNavigate={goToDate}
              pending={pending}
            />
            {viewingToday ? <RefreshPicksButton /> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "space-y-4 transition-opacity",
          pending && "pointer-events-none opacity-60",
        )}
        aria-busy={pending}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {viewingToday ? "Today" : formatDate(snapshot.pickDate)}
          </span>
          <span aria-hidden>·</span>
          <span>{snapshot.picks.length} picks</span>
          {snapshot.generatedAt ? (
            <>
              <span aria-hidden>·</span>
              <span>Generated {formatDateTime(snapshot.generatedAt)}</span>
            </>
          ) : null}
          {snapshot.source === "manual" ? (
            <>
              <span aria-hidden>·</span>
              <span>Manual refresh</span>
            </>
          ) : null}
        </div>

        {snapshot.picks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No picks for this day yet — they fill in once your store has synced
              product categories and confirmed Brand Brain personas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {snapshot.picks.map((pick, index) => (
              <PickCard key={pick.cluster} pick={pick} rank={index + 1} />
            ))}
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
}
