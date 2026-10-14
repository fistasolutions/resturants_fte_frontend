import { Skeleton } from "@/components/ui/skeleton";

/** Conversation-detail route skeleton (SPEC-094). Renders bare through the
 * Gorgias shell, so the fallback paints its own header + message body. */
export default function ConversationDetailLoading() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
