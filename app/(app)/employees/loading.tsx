import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton (SPEC-232): the header comes from the layout, which wraps
 * this fallback too. The shape is the page's — a team line, then four employee cards. */
export default function EmployeesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
