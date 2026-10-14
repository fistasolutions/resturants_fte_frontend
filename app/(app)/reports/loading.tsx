import { Skeleton } from "@/components/ui/skeleton";

/** Content-only fallback (SPEC-232): the header is painted by the layout shell,
 * so this never draws a second one. The shape is SPEC-288's: the pickers, the
 * summary panel, the six-tile strip, then two-up and three-up panels. */
export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
