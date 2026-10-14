"use client";


import { RoleButton } from "@/components/shared/role-gate";
import { useReportGeneration } from "@/features/reports/generation-context";
import { GlispIcon } from "@/components/shared/glisp-icon";

interface GenerateReportButtonProps {
  date: string;
  scope: string;
  /** Copy variant: first generation vs refresh of an existing report. */
  variant?: "generate" | "regenerate";
}

/**
 * Explicit on-demand generation (SPEC-033/034): the click hands off to the
 * generation boundary, which swaps the report area to skeletons until the
 * fresh payload renders. Errors land inline via aria-live.
 */
export function GenerateReportButton({
  date,
  scope,
  variant = "generate",
}: GenerateReportButtonProps) {
  const { pending, error, generate } = useReportGeneration();

  return (
    <div className="flex flex-col items-start gap-2">
      <RoleButton need="reports.manage" onClick={() => generate(date, scope)} disabled={pending} aria-busy={pending}>
        <GlispIcon className="size-4" state={pending ? "generating" : undefined} aria-hidden />
        {pending
          ? "Generating…"
          : variant === "regenerate"
            ? "Regenerate this view"
            : "Generate this view"}
      </RoleButton>
      <p aria-live="polite" role="status" className="text-xs text-destructive">
        {error}
      </p>
    </div>
  );
}
