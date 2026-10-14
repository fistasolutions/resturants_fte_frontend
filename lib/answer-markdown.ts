/**
 * The answer renderer's pure half (SPEC-352): repair a table written as pipe-joined bullets,
 * tell a figure from text so a table can right-align it, and tell an in-app link from an
 * external one. No React — `ChatMarkdown` renders, this decides.
 */

const BULLET = /^\s{0,3}(?:([-*+])|(\d+)[.)])\s+(.*)$/;
const CELL_SPLIT = /\s+\|\s+/;
const FENCE = /^\s{0,3}(```|~~~)/;
const MIN_CELLS = 3;
const MIN_ROWS = 2;
/** "Balance: $5,505.00", "**Status:** Paid". */
const LABELLED = /^\*{0,2}([A-Za-z][A-Za-z0-9 #&/'().-]{0,30}?)\*{0,2}:\*{0,2}\s+(.+)$/;
/** "Due 2025-02-23", "Bill #26000" — a word before a figure, never a name like "The Nina…". */
const WORD_THEN_FIGURE = /^([A-Za-z][A-Za-z]{1,20})\s+([#$€£¥₪\d].*)$/;
const FIGURE = /^[-+−]?\(?[$€£¥₪]?\s?\d[\d,]*(?:\.\d+)?\s?(?:%|[kKmMbB])?\)?$/;

interface Row {
  number: string | null;
  cells: string[];
}

function cellsOf(line: string): Row | null {
  const match = BULLET.exec(line);
  if (!match) return null;
  const body = match[3].trim();
  if (body.startsWith("|")) return null;
  const cells = body.split(CELL_SPLIT).map((cell) => cell.trim());
  if (cells.length < MIN_CELLS || cells.some((cell) => cell === "")) return null;
  return { number: match[2] ?? null, cells };
}

/** A column's header and its cells with that header taken off, when every filled cell
 * says the same label; else no header and the cells as they were. */
function inferColumn(cells: string[]): { header: string; cells: string[] } {
  const filled = cells.filter((cell) => cell !== "");
  for (const pattern of [LABELLED, WORD_THEN_FIGURE]) {
    const matches = filled.map((cell) => pattern.exec(cell));
    if (matches.length < MIN_ROWS || matches.some((m) => m === null)) continue;
    const labels = new Set(matches.map((m) => (m as RegExpExecArray)[1].trim().toLowerCase()));
    if (labels.size !== 1) continue;
    const header = (matches[0] as RegExpExecArray)[1].trim();
    return {
      header: header.charAt(0).toUpperCase() + header.slice(1),
      cells: cells.map((cell) => (cell === "" ? "" : (pattern.exec(cell) as RegExpExecArray)[2].trim())),
    };
  }
  return { header: "", cells };
}

function toTable(rows: Row[]): string[] {
  const width = Math.max(...rows.map((row) => row.cells.length));
  const numbered = rows.every((row) => row.number !== null);
  const columns: { header: string; cells: string[] }[] = [];
  for (let col = 0; col < width; col += 1) {
    columns.push(inferColumn(rows.map((row) => row.cells[col] ?? "")));
  }
  if (numbered) columns.unshift({ header: "#", cells: rows.map((row) => row.number as string) });
  const line = (values: string[]) => `| ${values.join(" | ")} |`;
  return [
    line(columns.map((c) => c.header)),
    line(columns.map(() => "---")),
    ...rows.map((_, i) => line(columns.map((c) => c.cells[i]))),
  ];
}

/**
 * A list whose every item is a record — two or more bullets that each split into three or
 * more ` | ` cells — written back as the GFM table it should have been. Everything else is
 * returned untouched: ordinary bullets, real tables, and anything inside a code fence.
 */
export function normalizeAnswerMarkdown(markdown: string): string {
  if (!markdown.includes(" | ")) return markdown;
  const lines = markdown.split("\n");
  const out: string[] = [];
  let fenced = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (FENCE.test(line)) fenced = !fenced;
    const first = fenced ? null : cellsOf(line);
    if (first === null) {
      out.push(line);
      i += 1;
      continue;
    }
    const run: Row[] = [first];
    let j = i + 1;
    while (j < lines.length) {
      const next = cellsOf(lines[j]);
      if (next === null) break;
      run.push(next);
      j += 1;
    }
    if (run.length < MIN_ROWS) {
      out.push(line);
      i += 1;
      continue;
    }
    if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
    out.push(...toTable(run));
    if (j < lines.length && lines[j].trim() !== "") out.push("");
    i = j;
  }
  return out.join("\n");
}

/** A table cell that holds a figure (currency, count, percentage), to right-align it. */
export function looksNumeric(text: string): boolean {
  const value = text.replace(/\*/g, "").trim();
  return value !== "" && FIGURE.test(value);
}

/** A link to a page of this app: a relative path, never protocol-relative. */
export function isInAppHref(href: string | null | undefined): href is string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\");
}
