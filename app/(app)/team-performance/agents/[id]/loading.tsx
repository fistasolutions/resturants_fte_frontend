import { Skeleton } from "@/components/ui/skeleton";

/** Agent-detail route skeleton (SPEC-094). This route renders bare through the
 * Gorgias shell, so the fallback paints its own header + stat row + body. */
export default function AgentDetailLoading() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </main>
  );
}
