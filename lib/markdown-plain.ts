/**
 * Markdown → speakable plain text (SPEC-240). The read-aloud button hands the
 * result to the browser's speech synthesis, so what the reader hears is the
 * answer's words, not its syntax: no hashes, asterisks, pipes or URLs.
 */

/** Inline syntax → words: links, code, emphasis, strike. Applied to prose lines
 * and to every table cell alike. */
function stripInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → text
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/(\*\*|__)(.+?)\1/g, "$2") // bold
    .replace(/(\*|_)(.+?)\1/g, "$2") // italics
    .replace(/~~(.+?)~~/g, "$1"); // strike
}

/** Flatten a GFM table row into "a, b, c." so a table reads as sentences. */
function tableRowToSentence(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return null;
  const cells = trimmed
    .split("|")
    .slice(1, -1)
    .map((cell) => stripInline(cell.trim()))
    .filter((cell) => cell.length > 0);
  if (cells.length === 0) return "";
  // A separator row (|---|:--:|) carries nothing to say.
  if (cells.every((cell) => /^:?-{2,}:?$/.test(cell))) return "";
  return `${cells.join(", ")}.`;
}

export function markdownToPlainText(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let inFence = false;
  for (const raw of lines) {
    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      out.push(raw.trim());
      continue;
    }
    const table = tableRowToSentence(raw);
    if (table !== null) {
      if (table) out.push(table);
      continue;
    }
    let line = raw;
    line = line.replace(/^\s{0,3}#{1,6}\s+/, ""); // headings
    line = line.replace(/^\s*>\s?/, ""); // blockquote
    line = line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ""); // list markers
    line = line.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/, ""); // rules
    line = stripInline(line);
    line = line.trim();
    if (line) out.push(line);
  }
  return out.join(" ").replace(/\s{2,}/g, " ").trim();
}
