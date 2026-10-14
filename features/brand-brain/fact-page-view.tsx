"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { confirmCopy } from "@/lib/confirm";
import { useConfirm } from "@/components/shared/confirm-provider";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrandBrainBreadcrumb } from "@/features/brand-brain/brand-brain-breadcrumb";
import { HistoryView } from "@/features/brand-brain/history-view";
import { useBrandBrainRefresh } from "@/features/brand-brain/use-brand-brain-refresh";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import { brandBrainHref, conflictCurrentValue, factHref, factSectionLabel, relatedFacts, SECTION_USERS, sourceHref, sourceKindLabel } from "@/lib/brand-brain";
import { brandBrainQueries } from "@/lib/queries/brand-brain";
import { cn } from "@/lib/utils";
import { approveFact, rejectFact, setFactEnabled } from "@/services/brand-brain-actions";
import { deleteFact, updateFact } from "@/services/spotlight-actions";
import type { Fact } from "@/types/spotlight";
import { formatDate } from "@/utils/format";

import FactLoading from "@/app/(app)/spotlight/brand-brain/facts/[id]/loading";

const STATUS_LABEL: Record<string, string> = { approved: "Approved", pending: "Awaiting your decision", conflict: "Conflicts with the approved value", rejected: "Rejected" };
const STATUS_TONE: Record<string, string> = { approved: "bg-success/10 text-success", pending: "bg-warning/15 text-warning", conflict: "bg-destructive/10 text-destructive", rejected: "bg-muted text-muted-foreground" };

function EditFact({ fact, onDone }: { fact: Fact; onDone: () => void }) {
  const [label, setLabel] = useState(fact.label);
  const [value, setValue] = useState(fact.value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (fact.id == null) return;
        setBusy(true);
        setError(null);
        updateFact(fact.id, { label: label.trim() || fact.label, value: value.trim() || fact.value })
          .then(onDone)
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Couldn't save."))
          .finally(() => setBusy(false));
      }}
    >
      <Input value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Label" maxLength={255} />
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} aria-label="Value" maxLength={4000} rows={4} />
      <div className="flex items-center gap-2">
        <RoleButton need="brand_brain.manage" type="submit" size="sm" disabled={busy}>
          <Check className="size-3.5" aria-hidden /> Save
        </RoleButton>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}

/**
 * One fact on its own page (SPEC-274): breadcrumb; the fact with Edit or the
 * decision; where it was cited from (linking to the document page); who uses it;
 * its own history; related facts.
 */
export function FactPageView({ id }: { id: number }) {
  const confirm = useConfirm();
  const router = useRouter();
  const refresh = useBrandBrainRefresh();
  const detail = useApiQuery(brandBrainQueries.fact(id));
  const all = useApiQuery(brandBrainQueries.facts());
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (detail.isPending) return <FactLoading />;
  if (detail.isError) {
    if (isNotFound(detail.error)) notFound();
    return <QueryErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  }
  const { fact, source, events } = detail.data;
  const status = fact.status ?? "approved";
  const section = fact.section ?? "identity";
  const off = fact.enabled === false;
  const current = conflictCurrentValue(fact);
  const related = all.data ? relatedFacts(fact, all.data) : [];

  async function act(key: string, action: () => Promise<unknown>, after?: () => void) {
    setBusy(key);
    setError(null);
    try {
      await action();
      refresh();
      after?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that — try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 pb-16 md:p-6">
      <BrandBrainBreadcrumb section="facts" sectionLabel="Facts" current={fact.label} />

      <Card className="gap-3 p-5">
        <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {factSectionLabel(section)} · fact
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] tracking-widest", STATUS_TONE[status])}>{STATUS_LABEL[status]}</span>
          {off ? <span className="rounded-full border border-border px-2 py-0.5 text-[10px] tracking-widest">switched off</span> : null}
        </p>
        {editing ? (
          <EditFact
            fact={fact}
            onDone={() => {
              setEditing(false);
              refresh();
            }}
          />
        ) : (
          <>
            <h1 className="font-heading text-xl tracking-wide">{fact.label}</h1>
            {status === "conflict" && current ? (
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="text-[10px] font-semibold tracking-widest uppercase">Approved today </span>
                  <span className="line-through">{current}</span>
                </p>
                <p>
                  <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">The document says </span>
                  {fact.value}
                </p>
              </div>
            ) : (
              <p className={cn("text-sm leading-relaxed", off && "text-muted-foreground")}>{fact.value}</p>
            )}
          </>
        )}
        {!editing ? (
          <div className="flex flex-wrap items-center gap-2">
            {fact.id == null ? (
              <span className="text-xs text-muted-foreground">Measured from the store — read-only.</span>
            ) : status === "conflict" ? (
              <>
                <RoleButton need="brand_brain.manage" size="sm" className="bg-success text-success-foreground hover:bg-success/90" disabled={busy !== null} onClick={() => void act("approve", () => approveFact(fact.id as number))}>
                  Replace with the document&apos;s value
                </RoleButton>
                <RoleButton need="brand_brain.manage" size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("reject", () => rejectFact(fact.id as number))}>
                  Keep the approved value
                </RoleButton>
              </>
            ) : status === "pending" ? (
              <>
                <RoleButton need="brand_brain.manage" size="sm" className="bg-success text-success-foreground hover:bg-success/90" disabled={busy !== null} onClick={() => void act("approve", () => approveFact(fact.id as number))}>
                  <Check className="size-3.5" aria-hidden /> Approve
                </RoleButton>
                <RoleButton need="brand_brain.manage" size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={busy !== null} onClick={() => void act("reject", () => rejectFact(fact.id as number))}>
                  <X className="size-3.5" aria-hidden /> Reject
                </RoleButton>
              </>
            ) : status === "rejected" ? (
              <RoleButton need="brand_brain.manage" size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("approve", () => approveFact(fact.id as number))}>
                Restore
              </RoleButton>
            ) : (
              <>
                <RoleGate need="brand_brain.manage">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" aria-hidden /> Edit
                  </Button>
                </RoleGate>
                <RoleButton need="brand_brain.manage" size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("toggle", () => setFactEnabled(fact.id as number, off))}>
                  {off ? "Switch on" : "Switch off"}
                </RoleButton>
                <RoleButton
                  need="brand_brain.manage"
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={busy !== null}
                  onClick={async () => {
                    if (await confirm(confirmCopy("fact", fact.label))) void act("delete", () => deleteFact(fact.id as number), () => router.push(brandBrainHref("facts")));
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden /> Delete
                </RoleButton>
              </>
            )}
            {error ? <span className="text-xs text-destructive">{error}</span> : null}
            <span className="ml-auto text-xs text-muted-foreground">{status === "approved" ? "Every writer reads this line exactly as it is written." : status === "rejected" ? "The writers never read this." : "Nothing reaches a writer until you decide."}</span>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-2 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Cited from</p>
          {source ? (
            <Link href={sourceHref(source.id)} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-[9px] font-extrabold tracking-wider">{sourceKindLabel(source.kind)}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{source.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {fact.sourceLocator ? `${fact.sourceLocator} · ` : ""}
                  {source.uploadedAt ? `added ${formatDate(source.uploadedAt)}` : ""} · open the document →
                </span>
              </span>
            </Link>
          ) : (
            <p className="text-sm">
              {fact.source === "onboarding" ? "Entered at onboarding from the founding Brand Brain document." : fact.source === "measured" ? `Measured from the synced store${fact.sourceNote ? ` — ${fact.sourceNote}` : ""}.` : fact.source === "research" ? "Proposed by AI research." : "Added by hand."}
              {fact.confirmedAt ? <span className="text-muted-foreground"> Confirmed {formatDate(fact.confirmedAt)}.</span> : null}
            </p>
          )}
        </Card>
        <Card className="gap-2 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Who uses it</p>
          <p className="flex flex-wrap gap-1.5">
            {SECTION_USERS[section].map((u) => (
              <span key={u} className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                {u}
              </span>
            ))}
          </p>
          <p className="text-xs text-muted-foreground">{status === "approved" && !off ? "Reading this fact today." : "Will read it once it is approved and switched on."}</p>
        </Card>
      </div>

      <HistoryView events={events} subtitle="this fact only" empty="Nothing has happened to this fact yet." />

      {related.length ? (
        <Card className="gap-2 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Related facts · {factSectionLabel(section)}</p>
          <ul className="divide-y divide-border">
            {related.map((r) => (
              <li key={r.id ?? r.label} className="py-2 text-sm">
                <Link href={factHref(r.id as number)} className="font-medium underline-offset-2 hover:underline">
                  {r.label}
                </Link>
                <p className="truncate text-[13px] text-muted-foreground">{r.value}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        <Link href={brandBrainHref("facts")} className="underline-offset-2 hover:underline">
          ← Back to Facts
        </Link>
      </p>
    </main>
  );
}
