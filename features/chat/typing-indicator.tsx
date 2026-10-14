/** "Glisp is thinking" (SPEC-252): the status phrase beside the animated avatar —
 * the agent's live progress (SPEC-036) when there is one, "Thinking…" otherwise.
 * The avatar itself carries the motion (`BotAvatar state="thinking"`); the old
 * spiral loader is gone. Shared by /chat and the Ask Glisp panel. */
export function TypingIndicator({ label }: { label?: string }) {
  return (
    <div
      className="flex w-fit items-center gap-2 rounded-card bg-card px-3 py-2"
      role="status"
      aria-live="polite"
      aria-label={label ?? "Glisp is thinking"}
    >
      <p className="text-sm text-muted-foreground">{label ?? "Thinking…"}</p>
    </div>
  );
}
