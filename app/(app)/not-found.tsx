import { ErrorState } from "@/components/shared/error-state";
import { classifyError } from "@/lib/error-boundary";

/**
 * The 404 for `notFound()` thrown inside the app (SPEC-227).
 *
 * This is not hypothetical: the product, tax-report and agent detail routes all
 * call `notFound()` for a bad id or a 404 from the API, and until now every one of
 * them rendered Next's default black-and-white screen outside the shell. This
 * renders inside the sidebar, so a mistyped id is one click from the list it came
 * from.
 *
 * A Server Component — there is nothing to retry, only somewhere to go.
 */
export default function AppNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 md:p-6">
      <ErrorState presentation={classifyError(new Error("not_found"))} />
    </main>
  );
}
