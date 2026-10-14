"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/hooks/use-can";

interface GenerationState {
  pending: boolean;
  error: string | null;
  generate: (date: string, scope: string) => void;
}

const GenerationContext = createContext<GenerationState | null>(null);

export function useReportGeneration(): GenerationState {
  const state = useContext(GenerationContext);
  if (state === null) {
    throw new Error("useReportGeneration requires <ReportGenerationBoundary>.");
  }
  return state;
}

/** Mirrors the report layout while the AI writes (SPEC-034 Patches). */
function GeneratingSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

/**
 * Owns the report-generation lifecycle (SPEC-034 Patches): the moment a
 * generation starts, the whole report area swaps to skeletons; the fresh
 * content replaces them exactly when the server refresh lands (the React
 * transition keeps `pending` true until the new payload is rendered).
 */
export function ReportGenerationBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const can = useCan();
  const gate = can("reports.manage");

  async function generate(date: string, scope: string) {
    // SPEC-358: a role that may not write reports is told why instead of meeting a 403.
    if (!gate.allowed) {
      setError(gate.reason);
      return;
    }
    setIsRequesting(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date });
      if (scope !== "all") params.set("scope", scope);
      const response = await fetch(`/api/proxy/reports/generate?${params}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(
          `Generating the report failed (${response.status}) — try again in a moment.`,
        );
      }
      startTransition(() => router.refresh());
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "Something went wrong — check your connection and try again.",
      );
    } finally {
      setIsRequesting(false);
    }
  }

  const pending = isRequesting || isRefreshing;

  return (
    <GenerationContext.Provider value={{ pending, error, generate }}>
      {pending ? (
        <div>
          <p role="status" aria-live="polite" className="mb-3 text-sm text-muted-foreground">
            Generating the report — this takes a few seconds…
          </p>
          <GeneratingSkeleton />
        </div>
      ) : (
        children
      )}
    </GenerationContext.Provider>
  );
}
