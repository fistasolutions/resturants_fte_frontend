"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { generateDisabledReason } from "@/lib/generation";
import { startGeneration } from "@/services/spotlight-generation";

import { useGeneration } from "./generation-provider";

/** Kicks off blog-writer generation for one query-bank topic. It no longer
 * streams on the button; instead it navigates straight to the live "new draft"
 * surface (`/spotlight/draft/new?query_id={id}`, SPEC-115 Patches), where the
 * agent's status and the article body stream into an article-shaped view —
 * identical feel to the refine loop — and `router.replace`s onto the saved
 * draft when it's done. Keeps a brief disabled "Starting…" state so the click
 * can't double-fire during the route transition. */
/** Seeded either by a query-bank id (`query_id`) or, for a Daily Pick
 * (SPEC-155), by a free-text `keyword`. Exactly one is provided; the draft/new
 * surface accepts both forms. */
type GenerateDraftButtonProps =
  | { queryId: number; keyword?: never; label?: string }
  | { keyword: string; queryId?: never; label?: string };

export function GenerateDraftButton({
  queryId,
  keyword,
  label = "Generate draft",
}: GenerateDraftButtonProps) {
  const router = useRouter();
  const { job, setJob } = useGeneration();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One generation at a time (backend SPEC-224). DISABLED, never hidden — a control
  // that vanishes reads as a bug; one that is disabled and explains itself does not.
  const blocked = generateDisabledReason(job);

  async function handleGenerate() {
    if (blocked) return;
    setBusy(true);
    setError(null);
    try {
      const started = await startGeneration(
        queryId != null ? { queryId } : { keyword: keyword ?? "" },
      );
      // Show the toast at once rather than waiting for the next poll.
      setJob(started);
      const query =
        queryId != null
          ? `query_id=${queryId}`
          : `keyword=${encodeURIComponent(keyword ?? "")}`;
      router.push(`/spotlight/draft/new?${query}`);
    } catch (cause) {
      // The backend's 409 message ("a blog is already being generated") is the useful
      // answer to the click, not an error to hide.
      setError(cause instanceof Error ? cause.message : "Could not start generation.");
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <RoleButton
        need="spotlight.manage"
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={busy || blocked !== null}
        title={blocked ?? undefined}
        aria-live="polite"
      >
        <PenLine className={busy ? "size-3.5 animate-pulse" : "size-3.5"} aria-hidden />
        <span className="whitespace-nowrap">
          {busy ? "Starting…" : blocked ? "Writing…" : label}
        </span>
      </RoleButton>
      {error && (
        <p role="alert" className="max-w-64 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
