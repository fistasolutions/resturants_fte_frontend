import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton (SPEC-229): the header and tab bar come from the layout,
 * which wraps this fallback too — so they are already on screen and must not be
 * drawn again here. The route is dynamic, so without a skeleton the content area
 * sits blank on the server fetch (SPEC-119). */
export default function SystemLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-80" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, group) => (
        <div key={group} className="space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, card) => (
              <Skeleton key={card} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
