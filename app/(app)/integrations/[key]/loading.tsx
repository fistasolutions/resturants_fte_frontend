import { Skeleton } from "@/components/ui/skeleton";

/** An app's page draws its own header (SPEC-328), so its fallback is the whole page. */
export default function IntegrationLoading() {
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6" aria-label="Loading">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </main>
  );
}
