"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Card } from "@/components/ui/card";
import { AddPersonaCard, EditablePersonaCard } from "@/features/spotlight/brand-brain-rows";
import { confirmPersona } from "@/services/brand-brain-actions";
import type { Persona } from "@/types/spotlight";
import { formatDate, formatNumber } from "@/utils/format";

export function isSourced(p: Persona): boolean {
  return p.source === "onboarding" || p.source === "manual" || Boolean(p.confirmedAt);
}

export function ConfirmPersona({ persona, onChanged }: { persona: Persona; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (persona.dbId == null) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <RoleButton
        need="brand_brain.manage"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          confirmPersona(persona.dbId!)
            .then(onChanged)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Couldn't confirm."))
            .finally(() => setBusy(false));
        }}
      >
        <BadgeCheck className="size-3.5" aria-hidden /> Confirm this persona
      </RoleButton>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

/**
 * Brand Brain → Personas (SPEC-263): the audience cards (SPEC-111 editing kept),
 * with a source chip each and Confirm on any persona that research proposed and
 * nobody vouched for — a persona without a source is a guess.
 */
export function PersonasView({ personas, onChanged }: { personas: Persona[]; onChanged: () => void }) {
  const unsourced = personas.filter((p) => !isSourced(p));
  return (
    <div className="space-y-4">
      {unsourced.length > 0 ? (
        <Card className="border-l-4 border-l-warning p-4">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">
              {formatNumber(unsourced.length)} persona{unsourced.length === 1 ? "" : "s"} came from research or an
              uploaded document and nobody confirmed {unsourced.length === 1 ? "it" : "them"}.
            </span>{" "}
            Confirm the ones that are real, delete the rest — the writers only see confirmed personas.
          </p>
        </Card>
      ) : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {personas.map((persona) => (
          <div key={persona.dbId ?? persona.id} className="flex flex-col">
            <EditablePersonaCard persona={persona} onChanged={onChanged} />
            {isSourced(persona) ? (
              persona.confirmedAt ? (
                <p className="mt-1 px-1 text-[11px] text-muted-foreground">Confirmed {formatDate(persona.confirmedAt)}</p>
              ) : null
            ) : (
              <ConfirmPersona persona={persona} onChanged={onChanged} />
            )}
          </div>
        ))}
        <RoleGate need="brand_brain.manage">
          <AddPersonaCard onAdded={onChanged} />
        </RoleGate>
      </div>
    </div>
  );
}
