"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";
import {
  type ErrorBoundaryProps,
  classifyError,
  supportReference,
} from "@/lib/error-boundary";

/**
 * The root boundary (SPEC-227) — and the one that matters most in this product.
 *
 * An error boundary does not catch a throw from the layout at its own level, and
 * `app/(app)/layout.tsx` calls `getCurrentUser()` → `serverApi("/auth/me")` on
 * every single page load. So the two likeliest failures the product has — the
 * backend being unreachable, and an expired session — throw in the app layout,
 * where `(app)/error.tsx` can never see them. Without this file they fall through
 * to Next's unstyled default screen in exactly the case that matters most.
 *
 * There is no shell to render here (the layout that draws it is what failed), so
 * this stands alone and centred.
 */
export default function RootError({
  error,
  reset,
  unstable_retry,
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <ErrorState
        presentation={classifyError(error)}
        reference={supportReference(error)}
        onRetry={retry}
      />
    </main>
  );
}
