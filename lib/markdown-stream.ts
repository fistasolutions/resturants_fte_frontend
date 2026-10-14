/**
 * Streaming-markdown helpers (SPEC-016 Patches — parser upgrade). Pure and
 * unit-tested. The renderer splits the accumulated reply into COMPLETED
 * blocks (parsed once, memoized) and a growing TAIL (re-parsed per chunk,
 * with unbalanced inline tokens auto-closed so nothing flashes as literal
 * markdown syntax mid-stream).
 */

export interface StreamingSplit {
  /** `\n\n`-terminated blocks whose content can never change again. */
  stableBlocks: string[];
  /** The still-growing remainder (may be empty). */
  tail: string;
}

function fenceCount(text: string): number {
  return (text.match(/```/g) ?? []).length;
}

/**
 * Split accumulated markdown on blank lines into stable blocks + tail.
 * Fence-aware: blocks are merged while a ``` code fence is open, so a fenced
 * block is never split in half. Anything after the last blank line — or
 * inside a still-open fence — is tail.
 */
export function splitStreamingMarkdown(markdown: string): StreamingSplit {
  const parts = markdown.split("\n\n");
  const last = parts.pop() ?? "";

  const stableBlocks: string[] = [];
  let open: string | null = null;
  for (const part of parts) {
    const candidate: string = open === null ? part : `${open}\n\n${part}`;
    if (fenceCount(candidate) % 2 === 1) {
      open = candidate; // fence still open — keep absorbing blocks
    } else {
      if (candidate.trim()) stableBlocks.push(candidate);
      open = null;
    }
  }

  const tail = open === null ? last : `${open}\n\n${last}`;
  return { stableBlocks, tail };
}

const TABLE_DELIMITER = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const PARTIAL_DELIMITER = /^\s*\|[\s|:-]*$/;

function cellCount(row: string): number {
  return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").length;
}

/**
 * A table in flight (SPEC-355): GFM draws a table only once its `|---|` row exists, so a
 * streaming header showed as a line of pipes until then. The header gets its delimiter
 * row — or a partial one is completed — so the table renders from its first line and its
 * rows stream in under it.
 */
export function completeStreamingTable(tail: string): string {
  const lines = tail.split("\n");
  let start = lines.length;
  while (start > 0 && lines[start - 1].trimStart().startsWith("|")) start -= 1;
  if (start === lines.length) return tail;
  const header = lines[start];
  const delimiter = `| ${Array.from({ length: cellCount(header) }, () => "---").join(" | ")} |`;
  const second = lines[start + 1];
  if (second === undefined) return [...lines, delimiter].join("\n");
  if (!PARTIAL_DELIMITER.test(second)) return tail;
  if (TABLE_DELIMITER.test(second) && cellCount(second) === cellCount(header)) return tail;
  return [...lines.slice(0, start + 1), delimiter, ...lines.slice(start + 2)].join("\n");
}

/**
 * Auto-close unbalanced inline tokens in the streaming tail so partial
 * syntax renders as intended text instead of literal markers. Only
 * high-confidence tokens are handled — single `*`/`_` are deliberately
 * skipped (they collide with list markers and snake_case identifiers).
 */
export function closeDanglingTokens(tail: string): string {
  let closed = tail;

  // Open code fence: close it (and skip inline handling inside code).
  if (fenceCount(closed) % 2 === 1) {
    return `${closed}\n\`\`\``;
  }

  // Inline code: odd number of single backticks (fences already balanced).
  const backticks = (closed.replace(/```/g, "").match(/`/g) ?? []).length;
  if (backticks % 2 === 1) closed += "`";

  // Bold and strikethrough.
  if (((closed.match(/\*\*/g) ?? []).length) % 2 === 1) closed += "**";
  if (((closed.match(/~~/g) ?? []).length) % 2 === 1) closed += "~~";

  return completeStreamingTable(closed);
}
