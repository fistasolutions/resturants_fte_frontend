"use client";

import { useState } from "react";
import { Check, Inbox, LoaderCircle, Pencil, RefreshCw, X } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandBrainSectionBreadcrumb } from "@/features/brand-brain/brand-brain-breadcrumb";
import { useBrandResearch } from "@/features/brand-brain/brand-research-provider";
import {
  REVIEW_GROUPS,
  displayLabel,
  factGroup,
  factSectionTitle,
  groupCount,
  sourceLabel,
  lookSource,
  lookSubtitle,
  wordKindLabel,
  type ReviewGroupKey,
} from "@/lib/brand-research";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { approveAllResearch } from "@/services/brand-research-actions";
import {
  approveCompetitor,
  approveFact,
  confirmPersona,
  deleteRule,
  deleteVoiceRule,
  rejectCompetitor,
  rejectFact,
  updateRule,
  updateVoiceRule,
} from "@/services/brand-brain-actions";
import { deletePersona, updateFact } from "@/services/spotlight-actions";
import type { ResearchReview, ReviewFact } from "@/types/brand-research";

/**
 * Brand Brain → Review (SPEC-341): everything the Brand Researcher found that still waits for
 * the owner — grouped as the brain is, each finding with where it came from and its own
 * Approve / Edit / Remove, and Approve all on top. Nothing here reached the writers yet; an
 * approval is what puts it there.
 */
export function ResearchReviewView({ review, onChanged }: { review: ResearchReview; onChanged: () => void }) {
  const research = useBrandResearch();
  const [approving, setApproving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = research.run?.status === "running" || review.run?.status === "running";
  const progress = research.run?.status === "running" ? research.run.progress : (review.run?.progress ?? 0);
  const total = review.counts.total;

  async function approveAll() {
    setError(null);
    setApproving(true);
    try {
      await approveAllResearch();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't approve — try again.");
    } finally {
      setApproving(false);
    }
  }

  async function researchAgain() {
    setError(null);
    setStarting(true);
    try {
      await research.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the research — try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-4">
      <BrandBrainSectionBreadcrumb label="Review" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">What we found about your brand</h2>
          <p className="text-sm text-muted-foreground">
            {review.run?.finishedAt
              ? `Researched from your store on ${formatDate(review.run.finishedAt)}${review.run.trigger === "auto" ? ", right after it connected" : ""}.`
              : "Read from your store, your products and the stores you are compared with."}{" "}
            Nothing is used until you approve it.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RoleButton need="brand_brain.manage" variant="outline" size="sm" onClick={() => void researchAgain()} disabled={running || starting}>
            {starting ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
            {total || review.run ? "Research again" : "Research my brand"}
          </RoleButton>
          {total > 0 ? (
            <RoleButton need="brand_brain.manage" size="sm" onClick={() => void approveAll()} disabled={approving || running}>
              {approving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
              Approve all ({total})
            </RoleButton>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {running ? (
        <div role="status" className="flex items-center gap-3 rounded-xl border border-ai/30 bg-ai/5 px-4 py-3">
          <LoaderCircle className="size-4 shrink-0 animate-spin text-ai" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Researching your brand — {progress}%</p>
            <p className="text-xs text-muted-foreground">What it finds appears here when it finishes. You can leave this page.</p>
          </div>
        </div>
      ) : null}

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <Inbox className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">Nothing waiting for review</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {review.run?.status === "done"
              ? "Everything the research found has been decided. Research again any time your store changes."
              : "Research reads your store, your products and your competitors, and brings what it finds here for you to approve."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {REVIEW_GROUPS.filter((g) => groupCount(review, g.key) > 0).map((group) => (
            <section key={group.key} aria-labelledby={`review-${group.key}`} className="rounded-2xl border bg-card">
              <header className="flex items-baseline justify-between gap-3 border-b px-4 py-3">
                <div className="min-w-0">
                  <h3 id={`review-${group.key}`} className="text-sm font-semibold text-foreground">
                    {group.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{group.blurb}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {groupCount(review, group.key)}
                </span>
              </header>
              <ul className="divide-y">
                <GroupRows review={review} group={group.key} onChanged={onChanged} />
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupRows({ review, group, onChanged }: { review: ResearchReview; group: ReviewGroupKey; onChanged: () => void }) {
  switch (group) {
    case "about":
    case "voice": {
      const facts = review.facts.filter((f) => factGroup(f) === group);
      return (
        <>
          {facts.map((f) => (
            <FactRow key={`fact-${f.id}`} fact={f} onChanged={onChanged} />
          ))}
          {group === "voice"
            ? review.voiceRules.map((r) => (
                <Row
                  key={`voice-${r.id}`}
                  title={r.title}
                  body={r.detail}
                  source="From your product descriptions"
                  onApprove={() => updateVoiceRule(r.id, { enabled: true })}
                  onRemove={() => deleteVoiceRule(r.id)}
                  onChanged={onChanged}
                />
              ))
            : null}
        </>
      );
    }
    case "customers":
      return (
        <>
          {review.personas.map((p) => (
            <Row
              key={`persona-${p.id}`}
              title={p.name}
              subtitle={p.role}
              body={p.description}
              tags={p.tags}
              onApprove={() => confirmPersona(p.id)}
              onRemove={() => deletePersona(p.id)}
              onChanged={onChanged}
            />
          ))}
        </>
      );
    case "words":
      return (
        <>
          {review.words.map((w) => (
            <Row
              key={`word-${w.id}`}
              title={w.label}
              subtitle={wordKindLabel(w.kind)}
              body={w.detail ?? undefined}
              onApprove={() => updateRule(w.id, { enabled: true })}
              onRemove={() => deleteRule(w.id)}
              onChanged={onChanged}
            />
          ))}
        </>
      );
    case "look":
      return (
        <>
          {review.style.map((s) => (
            <Row
              key={`style-${s.id}`}
              title={s.label}
              subtitle={lookSubtitle(s.section)}
              body={s.detail ?? undefined}
              source={lookSource(s)}
              onApprove={() => updateRule(s.id, { enabled: true })}
              onRemove={() => deleteRule(s.id)}
              onChanged={onChanged}
            />
          ))}
        </>
      );
    case "competitors":
      return (
        <>
          {review.competitors.map((c) => (
            <Row
              key={`competitor-${c.id}`}
              title={c.name}
              subtitle={c.domain}
              body={c.positioning || c.why || undefined}
              source="Found by the competitor search"
              onApprove={() => approveCompetitor(c.id)}
              onRemove={() => rejectCompetitor(c.id)}
              onChanged={onChanged}
            />
          ))}
        </>
      );
  }
}

function FactRow({ fact, onChanged }: { fact: ReviewFact; onChanged: () => void }) {
  return (
    <Row
      title={displayLabel(fact.label)}
      subtitle={factSectionTitle(fact.section)}
      body={fact.value}
      source={sourceLabel(fact.locator)}
      replaces={fact.replaces}
      editValue={fact.value}
      onEdit={async (value) => {
        await updateFact(fact.id, { value });
        await approveFact(fact.id);
      }}
      onApprove={() => approveFact(fact.id)}
      onRemove={() => rejectFact(fact.id)}
      onChanged={onChanged}
    />
  );
}

/** One finding: what it is, where it came from, and its own decision. */
function Row({
  title,
  subtitle,
  body,
  tags,
  source,
  replaces,
  editValue,
  onEdit,
  onApprove,
  onRemove,
  onChanged,
}: {
  title: string;
  subtitle?: string;
  body?: string;
  tags?: string[];
  source?: string;
  replaces?: string | null;
  editValue?: string;
  onEdit?: (value: string) => Promise<void>;
  onApprove: () => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<"approve" | "remove" | "edit" | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(editValue ?? "");
  const [error, setError] = useState<string | null>(null);

  async function act(kind: "approve" | "remove" | "edit", work: () => Promise<unknown>) {
    setError(null);
    setBusy(kind);
    try {
      await work();
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="group flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-foreground">
          <span className="min-w-0 break-words">{title}</span>
          {subtitle ? <span className="text-xs font-normal text-muted-foreground">{subtitle}</span> : null}
        </p>
        {editing ? (
          <form
            className="mt-2 flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (onEdit && draft.trim()) void act("edit", () => onEdit(draft.trim()));
            }}
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={`Edit ${title}`} autoFocus className="h-8" />
            <RoleButton need="brand_brain.manage" type="submit" size="sm" disabled={busy !== null || !draft.trim()}>
              {busy === "edit" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              Save &amp; approve
            </RoleButton>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy !== null}>
              Cancel
            </Button>
          </form>
        ) : body ? (
          <p className="mt-0.5 text-sm break-words text-muted-foreground">{body}</p>
        ) : null}
        {tags?.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {source ? <span>{source}</span> : null}
          {replaces ? (
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-warning">Would replace: {replaces}</span>
          ) : null}
        </p>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
      {!editing ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <RoleButton need="brand_brain.manage" size="sm" variant="outline" className={cn("border-success/40 text-success hover:bg-success/10")} disabled={busy !== null} onClick={() => void act("approve", onApprove)}>
            {busy === "approve" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            Approve
          </RoleButton>
          {onEdit ? (
            <RoleGate need="brand_brain.manage">
              <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => setEditing(true)} aria-label={`Edit ${title}`}>
                <Pencil className="size-4" aria-hidden />
                Edit
              </Button>
            </RoleGate>
          ) : null}
          <RoleButton need="brand_brain.manage" size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" disabled={busy !== null} onClick={() => void act("remove", onRemove)} aria-label={`Remove ${title}`}>
            {busy === "remove" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <X className="size-4" aria-hidden />}
            Remove
          </RoleButton>
        </div>
      ) : null}
    </li>
  );
}
