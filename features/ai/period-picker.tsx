"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { PERIODS } from "@/lib/ai-value";
import type { AiValuePeriod } from "@/types/ai-value";

/** Widest window first, and All time is the default: the first question this page is
 * asked is what the system has run, and a 30-day slice answers a different question
 * while looking like an answer to that one. */
export function PeriodPicker({ active }: { active: AiValuePeriod }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div role="group" aria-label="Period" className="flex flex-wrap gap-1.5">
      {PERIODS.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={active === option.key}
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.set("period", option.key);
            router.push(`/ai?${next.toString()}`);
          }}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            active === option.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
