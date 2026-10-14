import { Skeleton } from "@/components/ui/skeleton";

/** The runs tab had no skeleton at all (SPEC-229), so switching to it showed an
 * empty content area until the fetch returned — on a route that pages through
 * 1,377 rows. Content only; the header and tab bar come from the layout. */
export default function AllRunsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-[10px]" />
          <Skeleton className="h-9 w-36 rounded-[10px]" />
        </div>
      </div>
      <Skeleton className="h-[640px] rounded-2xl" />
    </div>
  );
}
