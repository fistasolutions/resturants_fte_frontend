import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton — the Team Performance shell header + tabs stay put
 * (they live in the layout); only the themes load. */
export default function VoiceOfCustomerLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
