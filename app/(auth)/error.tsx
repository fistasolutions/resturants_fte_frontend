"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";
import {
  type ErrorBoundaryProps,
  classifyError,
  supportReference,
} from "@/lib/error-boundary";

/**
 * The login boundary (SPEC-227). Renders inside the split-screen auth layout, so
 * the brand panel stays and the failure reads as one form failing rather than the
 * product being gone.
 *
 * `classifyError`'s session branch would send someone here back to `/login` — the
 * page they are already on — so the sign-in action is dropped and only a retry is
 * offered. A dead link to the current page is worse than no link.
 */
export default function AuthError({
  error,
  reset,
  unstable_retry,
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const presentation = classifyError(error);
  const retry = unstable_retry ?? reset;

  return (
    <ErrorState
      presentation={{
        ...presentation,
        // Already on /login: offer the retry instead of a link to here.
        retryable: true,
        href: undefined,
        hrefLabel: undefined,
      }}
      reference={supportReference(error)}
      onRetry={retry}
    />
  );
}
