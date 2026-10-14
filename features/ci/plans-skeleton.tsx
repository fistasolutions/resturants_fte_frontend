import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** The Plans list while its read is in flight (SPEC-272): tiles, the filter row, six cards. */
export function PlansSkeleton() {
  return (
    <div className="space-y-6 pb-16" aria-busy>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="gap-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-12" />
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="ml-auto h-9 w-28 rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="gap-3 p-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="mt-2 h-10 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/** A plan while its read is in flight: the paper beside its rail. */
export function PlanReaderSkeleton() {
  return (
    <div className="space-y-4 pb-16" aria-busy>
      <Skeleton className="h-4 w-24" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="gap-4 p-6 md:p-8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2 pt-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          ))}
        </Card>
        <Card className="h-fit gap-3 p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      </div>
    </div>
  );
}
