"use client";

import { useState } from "react";
import { LoaderCircle, SendHorizontal } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ReviseResult, Revision } from "@/types/report-fte";

interface Props {
  revisions: Revision[];
  disabled?: boolean;
  onRevise: (message: string) => Promise<ReviseResult>;
  /** Fires after a revision that changed the plan — the caller re-runs it. */
  onApplied?: (result: ReviseResult) => void;
  className?: string;
}

const EXAMPLES = ["Only the top 10 brands", "Make it 30 days", "Add refund reasons", "Focus the summary on MIRAGE"];

/**
 * Ask for a change (SPEC-286): the run's revision thread and a box. A message goes
 * to the Report Editor, which changes the plan — never a figure — and replies; when
 * something changed the caller runs the plan again.
 */
export function RevisionChat({ revisions, disabled = false, onRevise, onApplied, className }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(text: string) {
    const clean = text.trim();
    if (!clean || busy || disabled) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onRevise(clean);
      setMessage("");
      if (result.applied) onApplied?.(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Asking for the change failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={cn("gap-3 p-4", className)}>
      <div className="flex items-center gap-2">
        <GlispIcon className="size-4 text-ai" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">Ask for a change</h3>
      </div>
      {revisions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Tell the FTE how the report should change — fewer rows, another period, a section added or
          dropped, a different focus for the summary. It changes the plan and runs it again; it never
          touches a figure.
        </p>
      ) : (
        <ol className="flex max-h-72 flex-col gap-2 overflow-y-auto scrollbar-subtle" aria-label="Revisions">
          {revisions.map((revision) => (
            <li key={revision.at} className="flex flex-col gap-1">
              <p className="self-end rounded-xl rounded-br-sm bg-foreground px-3 py-1.5 text-xs text-background">{revision.message}</p>
              <div className="self-start rounded-xl rounded-bl-sm border border-border bg-card px-3 py-1.5 text-xs text-foreground">
                <p>{revision.reply}</p>
                {revision.changes.length ? (
                  <ul className="mt-1 list-disc pl-4 text-[11px] text-muted-foreground">
                    {revision.changes.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(message);
        }}
      >
        <label htmlFor="revision-message" className="sr-only">
          What should change?
        </label>
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 focus-within:border-ai focus-within:ring-4 focus-within:ring-ai/10">
          <Textarea
            id="revision-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit(message);
              }
            }}
            placeholder={disabled ? "Wait for the run to finish…" : "e.g. only the top 10 brands"}
            rows={1}
            disabled={disabled || busy}
            className="max-h-32 min-h-8 resize-none border-0 bg-transparent px-0 py-1 text-xs shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="icon" variant="ghost" disabled={disabled || busy || !message.trim()} aria-label="Send">
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <SendHorizontal className="size-4" aria-hidden />}
          </Button>
        </div>
        {revisions.length === 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={disabled || busy}
                onClick={() => void submit(example)}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-[11px] text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
