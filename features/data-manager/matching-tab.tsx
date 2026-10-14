"use client";

import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useDataManager } from "@/features/data-manager/data-manager-context";
import { ExampleNote, Section, Tiles } from "@/features/data-manager/parts";
import { MEANING_LABELS, suggestMeaning } from "@/lib/data-manager";
import type { Meaning } from "@/types/data-manager";
import { formatNumber } from "@/utils/format";

const MEANINGS = Object.keys(MEANING_LABELS) as Meaning[];

/**
 * Matching (SPEC-374): what each column means — suggested from its name, confirmed once by the
 * owner — and the rows that could not be matched to a product on their own.
 */
export function MatchingTab() {
  const { data, uploads } = useDataManager();
  const params = useSearchParams();
  const tables = [...uploads, ...data.tables];
  const [tableId, setTableId] = useState(params.get("table") ?? tables.find((t) => t.id === "po-lines")?.id ?? tables[0].id);
  const table = tables.find((t) => t.id === tableId) ?? tables[0];
  const [choices, setChoices] = useState<Record<string, Meaning>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [accepted, setAccepted] = useState<string[]>([]);
  const selectId = useId();

  const m = data.matches;
  const candidates = data.candidates.filter((c) => !accepted.includes(c.sourceValue));

  return (
    <div className="flex flex-col gap-4">
      <ExampleNote />
      <Tiles
        tiles={[
          { label: "Matched by code", value: formatNumber(m.bySku), note: "exact match to a product variant" },
          { label: "Matched by barcode", value: formatNumber(m.byBarcode), note: "the code differs, the barcode agrees" },
          { label: "Needs a look", value: formatNumber(Math.max(0, m.needsLook - accepted.length)), note: "the name looks right, the code does not", tone: "warning" },
          { label: "Not on the store", value: formatNumber(m.notInShopify), note: "not launched yet, retired, or a sample", tone: "destructive" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section
          title="What each column means"
          description="Suggested from the column name. You confirm once; every later read remembers."
          actions={
            <select
              id={selectId}
              aria-label="Table"
              value={table.id}
              onChange={(e) => setTableId(e.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2 text-sm"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          }
        >
          <ul className="divide-y divide-border">
            {table.fields.map((field, column) => {
              const suggestion = suggestMeaning(field.name);
              const meaning = choices[field.name] ?? suggestion.meaning;
              const example = table.rows.find((row) => (row[column] ?? "").trim() !== "")?.[column] ?? "";
              return (
                <li key={field.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 sm:grid-cols-[minmax(0,1fr)_1rem_11rem_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{field.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{example || "—"}</p>
                  </div>
                  <ArrowRight className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden />
                  <select
                    aria-label={`What ${field.name} means`}
                    value={meaning}
                    onChange={(e) => setChoices((c) => ({ ...c, [field.name]: e.target.value as Meaning }))}
                    className="col-span-2 h-8 rounded-lg border border-border bg-card px-2 text-sm sm:col-span-1"
                  >
                    {MEANINGS.map((key) => (
                      <option key={key} value={key}>
                        {MEANING_LABELS[key]}
                      </option>
                    ))}
                  </select>
                  <span className="row-start-1 col-start-2 justify-self-end sm:row-auto sm:col-auto">
                    {confirmed[table.id] ? (
                      <StatusBadge tone="success">Confirmed</StatusBadge>
                    ) : (
                      <StatusBadge tone={suggestion.confidence >= 90 ? "success" : suggestion.confidence >= 80 ? "info" : "neutral"}>
                        {suggestion.confidence}% sure
                      </StatusBadge>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => setConfirmed((c) => ({ ...c, [table.id]: true }))} disabled={confirmed[table.id]}>
              <Check aria-hidden />
              {confirmed[table.id] ? "Meanings confirmed" : "Confirm meanings"}
            </Button>
            <p className="text-xs text-muted-foreground">Nothing is calculated from a column until its meaning is confirmed.</p>
          </div>
        </Section>

        <Section title="Rows that need a look" description="Pick the right product once; the row keeps it.">
          {candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Every suggested match is settled.</p>
          ) : (
            <ul className="divide-y divide-border">
              {candidates.map((c) => (
                <li key={c.sourceValue} className="flex items-center gap-3 py-2.5">
                  <span className="size-2 shrink-0 rounded-full bg-warning" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-mono text-xs">{c.sourceValue}</span> → <span className="font-medium">{c.product}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Store code <span className="font-mono">{c.shopifySku}</span> · {c.likeness}% alike
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAccepted((a) => [...a, c.sourceValue])}>
                    <Check aria-hidden />
                    This one
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
