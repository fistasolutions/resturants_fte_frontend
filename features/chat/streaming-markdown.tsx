"use client";

import { memo, useMemo } from "react";

import { ChatMarkdown } from "@/features/chat/chat-markdown";
import { isLeadBlock, tailIsLead } from "@/lib/chat-lead";
import {
  closeDanglingTokens,
  splitStreamingMarkdown,
} from "@/lib/markdown-stream";

/**
 * A completed block: its content never changes once emitted, so memo()
 * guarantees it parses exactly once for the whole stream.
 */
const StableBlock = memo(function StableBlock({
  block,
  lead,
}: {
  block: string;
  lead: boolean;
}) {
  return <ChatMarkdown content={block} lead={lead} />;
});

/**
 * Live-streaming markdown (SPEC-016 Patches): completed blocks render
 * memoized; only the growing tail re-parses per chunk, with unbalanced
 * tokens auto-closed so partial syntax never flashes. A pulsing caret bar
 * marks the live end of the reply.
 */
export function StreamingMarkdown({ content }: { content: string }) {
  const { stableBlocks, tail } = useMemo(
    () => splitStreamingMarkdown(content),
    [content],
  );
  const renderedTail = useMemo(() => closeDanglingTokens(tail), [tail]);

  return (
    <>
      {stableBlocks.map((block, index) => (
        // Stable blocks are append-only: index identity is permanent.
        <StableBlock
          key={index}
          block={block}
          lead={isLeadBlock(index, stableBlocks.length)}
        />
      ))}
      {/* SPEC-222: while nothing has completed the tail holds the opening
          sentence, so it leads — and stops leading the moment block 0 takes
          over, rather than the promotion sliding down the reply. */}
      {renderedTail && (
        <ChatMarkdown content={renderedTail} lead={tailIsLead(stableBlocks.length)} />
      )}
      <span
        className="mt-1 inline-block h-3.5 w-1 animate-pulse rounded-full bg-ai"
        aria-hidden
      />
    </>
  );
}
