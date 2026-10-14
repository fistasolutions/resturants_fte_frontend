import { Skeleton } from "@/components/ui/skeleton";

/** Drill-page skeleton (SPEC-138) — breadcrumb + title + <Skeleton className="h-96 rounded-2xl" />, matching the real
 * page shape (drill routes render bare, so this owns its padding). */
export default function Loading() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-80 max-w-full" />
      <Skeleton className="h-96 rounded-2xl" />
    </main>
  );
}
