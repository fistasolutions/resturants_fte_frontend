import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** A Knowledge Base item while its read is in flight (SPEC-274) — the page owns its frame. */
export default function Loading() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6" aria-busy>
      <Skeleton className="h-3 w-72" />
      <Card className="gap-3 p-5">
        <div className="flex gap-4">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-md" />
          ))}
        </div>
      </Card>
      <Card className="gap-0 p-0">
        <div className="flex gap-4 border-b border-border px-4 py-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        <div className="space-y-3 px-5 py-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
