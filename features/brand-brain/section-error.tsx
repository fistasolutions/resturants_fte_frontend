import { QueryErrorState } from "@/components/shared/query-error-state";

/** The one error state every Brand Brain sub-tab shows (SPEC-263). */
export function SectionError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return <QueryErrorState error={error} onRetry={onRetry} />;
}
