import { Skeleton } from "@/components/ui/skeleton";

/** Data Manager's content skeleton (SPEC-374): the tiles row and two cards. */
export function DataManagerSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-9 rounded-xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-56 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}
