import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton — the Store Traffic shell header + tabs stay put
 * (they live in the traffic layout); only this store's detail loads. */
export default function StoreDetailLoading() {
  return (
    <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </main>
  );
}
