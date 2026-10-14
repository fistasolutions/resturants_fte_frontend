import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton — the page owns its own breadcrumb and header (SPEC-282). */
export default function WebsiteFrictionLoading() {
  return (
    <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-8 w-72 max-w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </main>
  );
}
