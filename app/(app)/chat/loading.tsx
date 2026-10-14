import { Skeleton } from "@/components/ui/skeleton";

/** Real chat header bar instantly (SPEC-119) — "Chat with AI" + status render
 * immediately; only the avatar, message thread, and composer skeleton, so the
 * frame never flashes headerless while the shell waits on prompts + user. */
export default function ChatLoading() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b bg-card p-4 md:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl tracking-wide">Chat with AI</h1>
            <p className="flex items-center gap-1.5 text-xs text-success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Glisp · AI Business Analyst · Online
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-20 w-3/4 rounded-2xl" />
        <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl" />
        <Skeleton className="h-24 w-3/4 rounded-2xl" />
      </main>

      <div className="border-t bg-card p-4 md:px-6">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
