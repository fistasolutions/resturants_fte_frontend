"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";
import {
  type ErrorBoundaryProps,
  classifyError,
  supportReference,
} from "@/lib/error-boundary";

/**
 * The boundary for all 21 feature routes (SPEC-227).
 *
 * It sits inside `(app)/layout.tsx`, so the sidebar and nav stay on screen and a
 * failed page is one click from a working one — the failure is scoped to the page
 * that failed rather than swallowing the product.
 *
 * Note what this canNOT catch: a throw in `(app)/layout.tsx` itself, which is where
 * `getCurrentUser()` runs on every page load. That case is `app/error.tsx`.
 */
export default function AppError({
  error,
  reset,
  unstable_retry,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Where an error reporter would be called from, when the product has one.
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <main className="flex flex-1 items-center justify-center p-4 md:p-6">
      <ErrorState
        presentation={classifyError(error)}
        reference={supportReference(error)}
        onRetry={retry}
      />
    </main>
  );
}
