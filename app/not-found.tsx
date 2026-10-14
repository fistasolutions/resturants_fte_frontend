import { ErrorState } from "@/components/shared/error-state";
import { classifyError } from "@/lib/error-boundary";

/**
 * The 404 for a URL that matches no route at all (SPEC-227).
 *
 * Rendered by the root layout only — a route group's layout does not apply to the
 * root not-found — so unlike `(app)/not-found.tsx` this one stands alone, and
 * offers the way back to the dashboard that the missing shell cannot.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <ErrorState presentation={classifyError(new Error("not_found"))} />
    </main>
  );
}
