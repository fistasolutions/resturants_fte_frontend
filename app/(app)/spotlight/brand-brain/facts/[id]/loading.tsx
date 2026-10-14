import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** A fact while its read is in flight (SPEC-274) — the page owns its frame. */
export default function Loading() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6" aria-busy>
      <Skeleton className="h-3 w-72" />
      <Card className="gap-3 p-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="gap-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    </main>
  );
}
