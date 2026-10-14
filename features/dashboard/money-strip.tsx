"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { ExplainButton } from "@/features/chat/explain-button";
import { useApiQuery } from "@/hooks/use-api-query";
import { buildMoneyCards, missingSourcesNote, type MoneyCard } from "@/lib/dashboard-money";
import type { StripTone } from "@/lib/kpi-strip";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<StripTone, string> = {
  neutral: "text-foreground",
  good: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
};

const CARD_CLASS = "min-w-0 rounded-xl border border-border bg-card px-4 py-3";

/**
 * Money at stake (SPEC-237) — three cards above the Dashboard's KPI strip: cash
 * sitting still, leaked in the last 30 days, at risk if nothing changes. Fixed windows,
 * independent of the date picker (the titles say which). Every figure is a sum the
 * backend already computed (SPEC-244, root Rule 8); `lib/dashboard-money.ts` decides
 * tone, fold and copy, this only lays the cards out.
 *
 * Fetched on its own through the client cache (SPEC-230) so it never blocks the
 * Dashboard — and deliberately without `LIVE_QUERY_OPTIONS`: eight gathered reads are
 * not a once-a-minute refresh. A three-card skeleton while it loads, nothing at all if
 * it fails.
 */
export function MoneyStrip() {
  const money = useApiQuery(dashboardQueries.money());

  if (money.isError) return null;

  if (money.isPending) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Money at stake" aria-busy>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={CARD_CLASS}>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-7 w-40" />
            <Skeleton className="mt-1.5 h-3 w-44 max-w-full" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = buildMoneyCards(money.data);
  const note = missingSourcesNote(money.data);

  return (
    <section aria-label="Money at stake" className="space-y-1.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {cards.map((card) => (
          <MoneyCardView key={card.key} card={card} />
        ))}
      </div>
      {note ? <p className="px-1 text-[11px] text-muted-foreground">{note}</p> : null}
    </section>
  );
}

function MoneyCardView({ card }: { card: MoneyCard }) {
  return (
    <article className={cn("relative", CARD_CLASS)} aria-labelledby={`money-${card.key}`}>
      <p
        id={`money-${card.key}`}
        className="truncate pr-6 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground"
      >
        {card.title}
      </p>
      <ExplainButton target={{ metric: card.title, value: card.total, detail: card.question }} />
      <p
        className={cn(
          "truncate text-2xl font-bold leading-tight tracking-tight tabular-nums",
          TONE_CLASS[card.tone],
        )}
      >
        {card.total}
      </p>
      <p className="text-[11px] leading-snug text-muted-foreground">{card.question}</p>

      {card.empty ? (
        <p className="mt-3 text-xs text-muted-foreground">Nothing found.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {card.lines.map((line) => (
            <li key={line.key} className="min-w-0">
              <Link
                href={line.href}
                className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="text-xs font-medium leading-snug text-foreground">{line.label}</p>
                <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px] leading-snug text-muted-foreground">
                  <span className="tabular-nums">{line.sub}</span>
                  <span className="inline-flex items-center gap-0.5 text-primary underline-offset-2 group-hover:underline">
                    {line.action} <ArrowRight className="size-3" aria-hidden />
                  </span>
                </p>
              </Link>
            </li>
          ))}
          {card.hidden > 0 ? (
            <li className="text-[11px] text-muted-foreground">
              + {card.hidden} more
            </li>
          ) : null}
        </ul>
      )}
    </article>
  );
}
