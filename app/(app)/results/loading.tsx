import { Skeleton } from "@/components/ui/skeleton";

/** Content-only fallback (SPEC-232): the header is painted by the layout shell,
 * so this never draws a second one. */
export default function ResultsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
