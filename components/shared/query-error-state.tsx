"use client";

import { ErrorState } from "@/components/shared/error-state";
import { classifyError } from "@/lib/error-boundary";

interface QueryErrorStateProps {
  error: Error;
  onRetry: () => void;
}

/**
 * The failure panel a client view renders when its query rejects (SPEC-230) — the
 * same `ErrorState` the route boundaries use (SPEC-227), inside the page padding so
 * the shell, sidebar and header stay exactly where they were. Retry re-runs the
 * query through the proxy; a session-expired error links to login instead.
 */
export function QueryErrorState({ error, onRetry }: QueryErrorStateProps) {
  return (
    <div className="min-w-0 flex-1 p-4 md:p-6">
      <ErrorState presentation={classifyError(error)} onRetry={onRetry} />
    </div>
  );
}
