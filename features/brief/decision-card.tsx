"use client";

import { ChevronRight, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RoleGate } from "@/components/shared/role-gate";
import { DeltaBadge } from "@/features/brief/brief-kpis";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import type {
  BriefActionResult,
  BriefDecision,
  DecisionSentiment,
  DecisionState,
} from "@/types/brief";
import { formatCurrency, formatTime } from "@/utils/format";

interface DecisionCardProps {
  decision: BriefDecision;
  /** When this brief (and so this still-pending decision) was computed —
   * shown as "Prepared HH:MM · nothing sent yet" so the client can always
   * see nothing has gone out without their approval. */
  preparedAt: string;
  readonly?: boolean;
  /** The actual compared-against period, e.g. "Jul 31, 2026" (SPEC-076) —
   * omitted when there's no comparison to show (compare=none, or an older
   * archived snapshot). */
  compareLabel?: string;
}

/** Plain-language verdict, not just a colored arrow (SPEC-076 — client
 * feedback: a bare percentage doesn't say whether it's good or bad news).
 * "risk" cards (more overdue $ = worse) invert vs "opportunity" cards (more
 * transfer/winback $ = bigger, framed as more upside, not moralized). */
function compareVerdict(deltaPct: number, sentiment: DecisionSentiment): string {
  const increased = deltaPct >= 0;
  if (sentiment === "risk") return increased ? "Worse than" : "Better than";
  return increased ? "Bigger than" : "Smaller than";
}

// Every current decision fires a real side effect, so all three are
// reviewed and sent from their own page instead of an instant one-click
// approve. New decision types that DON'T need review fall through to the
// plain "Mark as done" button below.
const REVIEW_HREF: Record<string, string> = {
  unfulfilled_48h: "/brief/overdue",
  transfer_opportunity: "/inventory/transfers/review",
  dormant_vips: "/customers/winback",
};

function formatActedAt(iso: string): string {
  return formatTime(iso); // store (NY) time — SPEC-129
}

function buildApprovedMessage(decision: BriefDecision, actedAt: string | null): string {
  const time = actedAt ? formatActedAt(actedAt) : "";
  if (decision.type === "dormant_vips") {
    return `✓ Winback list synced to Klaviyo — recorded at ${time}`;
  }
  if (decision.type === "transfer_opportunity") {
    return `✓ Transfer sheets sent — recorded at ${time}`;
  }
  if (decision.type === "unfulfilled_48h") {
    return `✓ Overdue-order lists sent — recorded at ${time}`;
  }
  return `✓ Approved — recorded at ${time}`;
}

const BUTTON_PRIMARY =
  "inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50";
const BUTTON_SECONDARY =
  "inline-flex h-8 items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground";
const BUTTON_GHOST =
  "inline-flex h-8 items-center px-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50";

/**
 * One decision, as a row of the Decisions panel (SPEC-231): headline and why on the
 * left, the money on the right, the evidence folded behind a disclosure, then the
 * same action row as before. Approve/skip, the review links, the compare verdict and
 * every state message are unchanged from the card this used to be.
 */
export function DecisionCard({
  decision,
  preparedAt,
  readonly = false,
  compareLabel,
}: DecisionCardProps) {
  const [state, setState] = useState<DecisionState>(decision.state);
  const [actedAt, setActedAt] = useState<string | null>(decision.acted_at);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const can = useCan();
  const manage = can("brief.manage");

  async function handleAction(action: "approved" | "skipped") {
    setActing(true);
    setError(null);
    const prevState = state;
    const prevActedAt = actedAt;
    setState(action);
    setActedAt(new Date().toISOString());
    try {
      const res = await fetch("/api/proxy/brief/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision_type: decision.type, action }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: BriefActionResult = await res.json();
      setActedAt(data.acted_at);
    } catch {
      setState(prevState);
      setActedAt(prevActedAt);
      setError("Could not save — try again");
    } finally {
      setActing(false);
    }
  }

  /** SPEC-240 — a skip pressed by mistake. Optimistic like approve/skip: the row is
   * pending again at once, and rolls back if the DELETE fails. */
  async function handleUndoSkip() {
    setActing(true);
    setError(null);
    const prevState = state;
    const prevActedAt = actedAt;
    setState(null);
    setActedAt(null);
    try {
      const res = await fetch(`/api/proxy/brief/actions/${decision.type}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setState(prevState);
      setActedAt(prevActedAt);
      setError("Could not undo — try again");
    } finally {
      setActing(false);
    }
  }

  const isRisk = decision.sentiment === "risk";
  const amountClass = isRisk ? "text-destructive" : "text-success";
  const evidenceId = `decision-evidence-${decision.type}`;

  return (
    <div
      className={cn("px-4 py-3", state === "approved" && "bg-success/5 transition-colors")}
    >
      {/* Headline + why on the left, the money on the right. A skipped row dims its
          content, not its action row — the Undo has to look like a button. */}
      <div
        className={cn(
          "flex items-start justify-between gap-4",
          state === "skipped" && "opacity-60 transition-opacity",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{decision.headline}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{decision.why}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn("text-lg font-bold leading-tight tracking-tight tabular-nums", amountClass)}>
            {formatCurrency(decision.amount)}
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">{decision.amount_label}</p>
          {/* Compare badge + plain-language verdict (SPEC-075/SPEC-076) —
              absent on compare=none and on older archived snapshots that
              predate this field. */}
          {decision.amount_delta_pct != null && (
            <div className="mt-0.5 flex items-center justify-end gap-1.5">
              <DeltaBadge delta={decision.amount_delta_pct} invertDelta={isRisk} />
              <span className="text-[11px] text-muted-foreground">
                {compareVerdict(decision.amount_delta_pct, decision.sentiment)}
                {compareLabel ? ` ${compareLabel}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Evidence — folded by default, opens in place */}
      <div
        id={evidenceId}
        hidden={!evidenceOpen}
        className={cn(
          "mt-2 space-y-1 rounded-lg bg-muted/50 px-3 py-2",
          state === "skipped" && "opacity-60",
        )}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          {decision.evidence_tag}
        </span>
        <ul className="space-y-0.5">
          {decision.evidence_items.map((item, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{item.label}</span>
              {" · "}
              {item.value}
              {item.detail ? ` (${item.detail})` : ""}
            </li>
          ))}
        </ul>
        {decision.evidence_definition && (
          <p className="text-[11px] italic text-muted-foreground/70">
            {decision.evidence_definition}
          </p>
        )}
      </div>

      {/* Actions or state feedback, the evidence disclosure, and the prepared-at stamp */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {state === "approved" ? (
          <p className="text-sm font-semibold text-success">
            {buildApprovedMessage(decision, actedAt)}
          </p>
        ) : state === "skipped" ? (
          <>
            {!readonly ? (
              <RoleGate need="brief.manage">
                <button
                  type="button"
                  onClick={handleUndoSkip}
                  disabled={acting}
                  className={cn(BUTTON_SECONDARY, "gap-1.5 disabled:opacity-50")}
                >
                  <Undo2 className="size-3.5" aria-hidden />
                  Undo skip
                </button>
              </RoleGate>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Skipped for today — comes back tomorrow if still true
            </p>
          </>
        ) : readonly ? (
          <p className="text-xs italic text-muted-foreground">No action taken that day</p>
        ) : (
          <>
            {REVIEW_HREF[decision.type] ? (
              <Link href={REVIEW_HREF[decision.type]} className={BUTTON_PRIMARY}>
                Review &amp; Send &rarr;
              </Link>
            ) : (
              <button
                onClick={() => handleAction("approved")}
                disabled={acting || !manage.allowed}
                title={manage.reason ?? undefined}
                className={BUTTON_PRIMARY}
              >
                Mark as done ✓
              </button>
            )}
            <Link href={decision.view_href} className={BUTTON_SECONDARY}>
              View
            </Link>
            <RoleGate need="brief.manage">
              <button
                onClick={() => handleAction("skipped")}
                disabled={acting}
                className={BUTTON_GHOST}
              >
                Skip today
              </button>
            </RoleGate>
          </>
        )}

        <button
          type="button"
          onClick={() => setEvidenceOpen((v) => !v)}
          aria-expanded={evidenceOpen}
          aria-controls={evidenceId}
          className={cn(BUTTON_GHOST, "gap-1")}
        >
          <ChevronRight
            className={cn("size-3 transition-transform", evidenceOpen && "rotate-90")}
            aria-hidden
          />
          Evidence
        </button>

        {error ? (
          <span className="ml-auto text-xs text-destructive">{error}</span>
        ) : state === null && !readonly ? (
          <span className="ml-auto text-[11px] text-muted-foreground">
            Prepared {formatActedAt(preparedAt)}
            {" · "}nothing sent yet
          </span>
        ) : null}
      </div>
    </div>
  );
}
