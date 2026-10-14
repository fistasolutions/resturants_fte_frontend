"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { STATUSES, WINDOWS } from "@/lib/system-trace";

/**
 * Status and window filters (SPEC-228).
 *
 * URL-driven rather than component state: a filtered view is the thing an operator
 * pastes into a message ("it's failing, look"), and losing it on a refresh would
 * make this page useless in exactly the conversation it exists for. Changing a
 * filter also resets to page 1 — staying on page 4 of a narrower result set is how
 * a table shows a person an empty screen and no reason why.
 */
export function RunFilters({ jobId }: { jobId?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      const base = jobId ? `/system/${jobId}` : "/system/runs";
      router.push(next.toString() ? `${base}?${next}` : base);
    },
    [jobId, params, router],
  );

  const selectClass =
    "h-9 rounded-[10px] border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="run-status">
        Filter by outcome
      </label>
      <select
        id="run-status"
        className={selectClass}
        value={params.get("status") ?? ""}
        onChange={(event) => set("status", event.target.value)}
      >
        {STATUSES.map((option) => (
          <option key={option.key || "all"} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="run-window">
        Filter by period
      </label>
      <select
        id="run-window"
        className={selectClass}
        value={params.get("window") ?? "all"}
        onChange={(event) => set("window", event.target.value)}
      >
        {WINDOWS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
