import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton (SPEC-229): the header and period picker come from the
 * layout, which wraps this fallback too — so they are already on screen and must
 * not be drawn again. The route is dynamic, so without a skeleton the content area
 * sits blank on the server fetch (SPEC-119). */
export default function AiLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-9 w-80 rounded-lg" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
