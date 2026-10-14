import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/** Suspense fallback for a standalone AiCommentary section (perf fix) —
 * shown while the LLM-backed commentary call resolves, independent of
 * whatever fast data already rendered above it. */
export function AiCommentarySkeleton() {
  return (
    <Card className="gap-2 px-4 py-4">
      <Skeleton className="h-3 w-28" />
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </Card>
  );
}
