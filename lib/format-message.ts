/**
 * Clean a raw Gorgias message body for display (SPEC-094 Patch). Gorgias stores
 * the full email — markdown-link/image remnants, tracking URLs, marketing
 * signatures, unsubscribe lines, and the entire quoted reply chain ("On … wrote:"
 * + `>` lines). Rendered verbatim it's an unreadable mess. This reduces it to the
 * actual message. Pure + unit-tested; the raw body is untouched in the DB.
 */

// A line that begins the quoted history — everything from here down is the
// prior email being replied to, so we cut it.
const QUOTE_HEADER = [
  /^on\b.+\bwrote:?$/i, //  "On Thu, Aug 6 2026, at 6:32 AM, X <e> wrote:"
  /^-{2,}\s*original message\s*-{2,}/i,
  /^_{5,}$/, //  long underscore separator some clients add
  /^from:\s.+\bsent:\s/i, //  Outlook forwarded header on one line
];

// Signature / marketing / boilerplate lines to drop wherever they appear.
const STRIP_LINE = [
  /unsubscribe/i,
  /all rights reserved/i,
  /unlock exclusive perks/i,
  /ready to dive into/i,
  /^need support\??$/i,
  /make the most of your/i,
  /©\s*\d{4}/,
  /view (this )?(email )?in (your )?browser/i,
  /^customer service$/i,
  /join our .*(whatsapp|status|content)/i,
  /^follow us\b/i,
  /whatsapp\s*\+?[\d\s()-]{7,}/i,
  /^\[[^\]]*\]$/, //  bracket-only leftover, e.g. "[www.examplestore.com]"
  /^!?\[\]$/, //  stray "![]" / "[]" from a stripped image/link
  /^\s*[<>]+\s*$/, //  a line that's only angle brackets (NOT plain blank lines)
];

export function cleanMessageBody(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const text = raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // markdown images  ![alt](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // markdown links   [label](url) -> label
    .replace(/<https?:\/\/[^>]*>/gi, "") // <url> autolinks
    .replace(/\(\s*https?:\/\/[^\s)]+\s*\)/gi, "") // (url)
    .replace(/https?:\/\/[^\s)>\]]+/gi, "") // bare url
    .replace(/(^|\s)[<>]+(?=\s|$)/gm, "$1"); // stray standalone angle brackets

  const kept: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/[ \t]+/g, " ").trim();
    if (QUOTE_HEADER.some((rx) => rx.test(line))) break; // cut quoted history + all below
    if (line.startsWith(">")) continue; // quoted line
    if (STRIP_LINE.some((rx) => rx.test(line))) continue;
    const prev = kept[kept.length - 1];
    if (line === "" && (prev === "" || prev === undefined)) continue; // collapse blank runs
    if (line !== "" && line === prev) continue; // dedupe repeated line
    kept.push(line);
  }
  while (kept.length && kept[0] === "") kept.shift();
  while (kept.length && kept[kept.length - 1] === "") kept.pop();

  const cleaned = kept.join("\n").trim();
  return cleaned || null;
}
