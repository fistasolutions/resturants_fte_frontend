import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** A competitor while its read is in flight (SPEC-283) — the page owns its frame. */
export default function Loading() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6" aria-busy>
      <Skeleton className="h-3 w-72" />
      <Card className="gap-3 p-5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    </main>
  );
}
