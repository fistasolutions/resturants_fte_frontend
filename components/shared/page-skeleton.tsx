import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  /** Real header instantly (SPEC-119); omit for routes that draw their own header. */
  title?: string;
  description?: string;
  /** How many card-sized blocks to sketch below the header. */
  blocks?: number;
}

/**
 * The pending state for routes that have no bespoke `loading.tsx` (SPEC-230): the
 * real page header at once, then card-shaped skeletons where the data will land, so
 * the first paint has the page's shape and nothing shifts when the numbers arrive.
 */
export function PageSkeleton({ title, description, blocks = 3 }: PageSkeletonProps) {
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      {title && description ? (
        <PageHeader title={title} description={description} />
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: Math.max(0, blocks - 1) }, (_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </main>
  );
}
