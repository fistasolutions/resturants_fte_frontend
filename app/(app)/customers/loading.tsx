import { Skeleton } from "@/components/ui/skeleton";

/** Content-only fallback (SPEC-232) — the header and tab bar are painted by the
 * layout shell, so this must never draw a second header. Also what the Money Finder
 * view shows while its query is pending. */
export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-9 w-full max-w-md rounded-md" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
