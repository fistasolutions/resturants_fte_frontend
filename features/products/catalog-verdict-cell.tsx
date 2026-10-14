import { Skeleton } from "@/components/ui/skeleton";

/** Client-held verdict state for the visible page (SPEC-105): resolved notes,
 * plus the set of product ids the client has finished fetching (so an empty
 * result shows "—" instead of an endless skeleton). */
export interface VerdictState {
  verdicts: Map<number, string>;
  fetched: Set<number>;
}

/** One product's AI verdict: the note if resolved, "—" once fetched-but-empty,
 * else a skeleton (the one allowed animation) while it's being generated. */
export function CatalogVerdictText({
  productId,
  state,
}: {
  productId: number;
  state?: VerdictState;
}) {
  const note = state?.verdicts.get(productId);
  if (note) return <span className="text-muted-foreground">{note}</span>;
  if (!state || state.fetched.has(productId)) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <Skeleton className="h-4 w-40" aria-label="Generating AI verdict" />;
}
