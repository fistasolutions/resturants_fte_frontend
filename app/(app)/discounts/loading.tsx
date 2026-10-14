import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton for the Discount Monitoring tabs (SPEC-098). The header
 * + date picker + tab bar live in the persistent shell and stay painted across a
 * tab switch, so this fills only the body below them. */
export default function DiscountsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
