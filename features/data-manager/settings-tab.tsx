"use client";

import { useState } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { ExampleNote, Section } from "@/features/data-manager/parts";

const PRECEDENCE = ["Your tables (Airtable and uploads)", "Shipment invoices on Products › Costs", "Shopify's unit cost"];

const AUTONOMY = [
  { key: "approve", label: "Approve each change", detail: "Changes wait on the Changes tab until you apply them." },
  { key: "auto", label: "Apply small changes automatically", detail: "A cost moving less than 5% applies at once; anything bigger still waits for you." },
] as const;

/**
 * Settings (SPEC-374): the connection, how much it may do on its own, and which cost wins.
 * Data Manager never writes to Airtable or Shopify, so there is nothing to stop in a hurry.
 */
export function SettingsTab() {
  const [autonomy, setAutonomy] = useState<(typeof AUTONOMY)[number]["key"]>("approve");
  return (
    <div className="flex flex-col gap-4">
      <ExampleNote />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section title="Connection" description="Read-only. Data Manager never writes to Airtable or to your store." actions={<StatusBadge tone="neutral">Airtable not connected</StatusBadge>}>
          <ul className="space-y-1 text-sm">
            <li>Reading: <b>manual</b>, only when you press Read now on Sources.</li>
            <li>Uploads: CSV, Excel, PDF and image invoices, copied exactly as written.</li>
          </ul>
        </Section>
        <Section title="Autonomy" description="What it may do on its own.">
          <fieldset className="space-y-2">
            <legend className="sr-only">Autonomy</legend>
            {AUTONOMY.map((option) => (
              <label key={option.key} className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 has-[:checked]:border-foreground">
                <input
                  type="radio"
                  name="data-manager-autonomy"
                  value={option.key}
                  checked={autonomy === option.key}
                  onChange={() => setAutonomy(option.key)}
                  className="mt-1 accent-foreground"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </Section>
        <Section title="Which cost wins" description="When two places hold a cost for the same variant, the first in this list is used.">
          <ol className="divide-y divide-border">
            {PRECEDENCE.map((item, i) => (
              <li key={item} className="flex items-center gap-3 py-2 text-sm">
                <span className="grid size-5 place-items-center rounded-md bg-secondary text-[11px] font-bold tabular-nums text-muted-foreground">{i + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}
