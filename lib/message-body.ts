/**
 * Reading a support message the way an email client shows it (SPEC-348) — pure, so every rule
 * is unit-tested.
 *
 * A helpdesk message arrives as plain text that carries everything the email did: the new
 * words, the whole earlier exchange quoted underneath (`On … wrote:`, `Am … schrieb …:`, `>`
 * lines, Outlook `From:/Sent:` blocks), the HTML-to-text duplicates, a store footer, and links
 * written out as long tracking URLs or as `[label](url)`. `parseMessageBody` returns the new
 * words, each earlier message as its own entry with who sent it and when, and every footer
 * folded aside — with every link as a token the thread draws as a link, so nothing raw, and
 * nothing wider than the page, reaches the screen.
 */

export type InlineToken =
  | { kind: "text"; text: string }
  /** `compact`: drawn as a small chip (a bare or parenthesised URL), not as running text. */
  | { kind: "link"; href: string; label: string; compact: boolean }
  | { kind: "image"; href: string; label: string }
  | { kind: "email"; href: string; label: string };

/** One line of a paragraph. */
export type MessageLine = InlineToken[];

/** One line of an order: what was bought, how many, for how much (as the email wrote them). */
export interface OrderItem {
  name: string;
  quantity: string | null;
  total: string | null;
}

/** One row of an order's totals; `grand` marks the final Total. */
export interface OrderTotal {
  label: string;
  value: string;
  grand: boolean;
}

/** A piece of a message: running text, an address, or an order as a receipt (SPEC-348 §1c). */
export type MessageBlock =
  | { kind: "paragraph"; lines: MessageLine[] }
  | { kind: "address"; title: string; lines: string[] }
  | { kind: "order"; items: OrderItem[]; totals: OrderTotal[] };

/** One message quoted underneath the new words. */
export interface EarlierMessage {
  /** The sender's name as the header gives it; null when there was no header. */
  from: string | null;
  email: string | null;
  /** The date as the header wrote it — the sender's own clock and language. */
  date: string | null;
  body: MessageBlock[];
  /** Store footer, copyright, signature — folded by default. */
  footer: MessageBlock[];
}

export interface ParsedMessage {
  /** What the sender wrote this time. */
  visible: MessageBlock[];
  /** The sender's own footer or signature, folded by default. */
  footer: MessageBlock[];
  /** The earlier exchange, newest first, as separate messages. */
  earlier: EarlierMessage[];
}

// ── Recognising where the history starts ─────────────────────────────────────

/** Reply headers across the languages the stores' customers write in. */
const REPLY_HEADERS: readonly RegExp[] = [
  /^On\s.{4,300}?\bwrote\s?:/i,
  /^Am\s.{4,300}?\bschrieb\b.{0,200}:/i,
  /^Le\s.{4,300}?\ba\s+écrit\s?:/i,
  /^El\s.{4,300}?\bescribió\s?:/i,
  /^Op\s.{4,300}?\bschreef\b.{0,200}:/i,
  /^Il\s.{4,300}?\bha\s+scritto\s?:/i,
  /^Em\s.{4,300}?\bescreveu\s?:/i,
];

const ORIGINAL_MESSAGE = /^-{2,}\s*(original message|ursprüngliche nachricht|message d'origine|forwarded message)\s*-{2,}$/i;
const UNDERSCORE_RULE = /^_{10,}$/;
const FROM_LINE = /^(from|von|de|da|van)\s*:\s*\S/i;
const SENT_LINE = /^(sent|gesendet|envoyé|enviado|inviato|verzonden|date|datum)\s*:/i;
const OUTLOOK_FIELD = /^(from|sent|date|to|cc|bcc|subject|von|gesendet|an|betreff|datum|de|envoyé|à|objet|para|asunto)\s*:/i;

/** A reply header at `lines[i]` — alone, or wrapped onto the next line. Returns how many lines
 * it spans, or 0. */
function replyHeaderAt(lines: readonly string[], i: number): 0 | 1 | 2 {
  const line = lines[i];
  if (!line) return 0;
  if (REPLY_HEADERS.some((re) => re.test(line))) return 1;
  const next = lines[i + 1];
  if (next && REPLY_HEADERS.some((re) => re.test(`${line} ${next}`))) return 2;
  return 0;
}

function outlookBlockAt(lines: readonly string[], i: number): boolean {
  return FROM_LINE.test(lines[i] ?? "") && lines.slice(i + 1, i + 5).some((l) => SENT_LINE.test(l));
}

/** Whether the history starts at `lines[i]`. */
function startsHistory(lines: readonly string[], i: number): boolean {
  const line = lines[i];
  if (!line) return false;
  if (replyHeaderAt(lines, i) || ORIGINAL_MESSAGE.test(line) || line.startsWith(">")) return true;
  if (UNDERSCORE_RULE.test(line) && lines.slice(i + 1, i + 3).some((l) => FROM_LINE.test(l))) return true;
  return outlookBlockAt(lines, i);
}

// ── Footers ──────────────────────────────────────────────────────────────────

const FOOTER_STARTS: readonly RegExp[] = [
  /^--\s?$/,
  /^(sent from my (iphone|ipad|android|galaxy|samsung|mobile|phone)|sent from outlook|get outlook for (ios|android)|von meinem iphone gesendet|envoyé de mon (iphone|ipad))\b/i,
  /^(©|\(c\)\s|copyright\b)/i,
  /all rights reserved/i,
  /\bunsubscribe\b/i,
  /^follow us\b/i,
  /^stay in the loop\b/i,
  /^need (support|help)\?/i,
  /^download (our |the )?.{0,40}\bapp\b/i,
  /^join our\b/i,
  /^shop by\b/i,
  /^orders sold through\b/i,
  /^view (this|it) in (your )?browser/i,
];

/** Lines into the message and its footer: everything from the first footer line on, once
 * there is content before it. */
function splitFooter(lines: readonly string[]): { body: string[]; footer: string[] } {
  for (let i = 0; i < lines.length; i += 1) {
    // A marker deep inside a long line is content, not a footer (§1e).
    if (!lines[i] || lines[i].length > 200 || !FOOTER_STARTS.some((re) => re.test(lines[i]))) continue;
    if (!lines.slice(0, i).some(Boolean)) continue;
    return { body: lines.slice(0, i), footer: lines.slice(i) };
  }
  return { body: [...lines], footer: [] };
}

// ── Cleaning ─────────────────────────────────────────────────────────────────

/** Line endings, non-breaking and zero-width spaces, indentation from HTML-to-text. */
function normaliseLines(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/[​‌‍﻿]/g, "")
    .split("\n")
    .map((line) => line.trim());
}

// ── Flattened emails (SPEC-348 §1e) ──────────────────────────────────────────

const DAY_OR_MONTH =
  "(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\\.?,?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?|\\d{1,2}[.,]?";
/** Where a reply header starts in the middle of a line. */
const MID_HEADER = new RegExp(
  [
    `(?<=\\S)\\s+(?=On\\s+(?:${DAY_OR_MONTH})\\s[^\\n]{4,250}?\\bwrote\\s?:)`,
    `(?<=\\S)\\s+(?=Am\\s+(?:Mo|Di|Mi|Do|Fr|Sa|So|\\d{1,2})\\.?,?\\s[^\\n]{4,250}?\\bschrieb\\b)`,
    `(?<=\\S)\\s+(?=From:\\s[^\\n]{2,200}?\\sSent:\\s)`,
  ].join("|"),
  "g",
);
/** A header at the start of a line, up to the end of its `wrote:` / `schrieb …:`. */
const HEADER_HEAD = /^(?:On\s.{4,250}?\bwrote\s?:|Am\s.{4,250}?\bschrieb\b[^:]{0,200}:)(?:\s*\(mailto:[^)]*\))?(?:\s*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}>?)?/i;
/** An Outlook block run into one line: each field starts its own line. */
const OUTLOOK_INLINE = /(?<=\S)\s+(?=(?:Sent|To|Cc|Subject):\s)/g;

/** Restore the line breaks a flattened email lost: every reply header starts a line, and what
 * follows its `wrote:` starts another. Lines already broken properly are untouched. */
function unflatten(lines: readonly string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (!line) {
      out.push(line);
      continue;
    }
    for (const part of line.split(MID_HEADER)) {
      const head = part.match(HEADER_HEAD);
      if (head && head[0].length < part.length) {
        out.push(head[0].trim(), part.slice(head[0].length).trim());
      } else if (/^From:\s.{2,200}?\sSent:\s/.test(part)) {
        out.push(...part.split(OUTLOOK_INLINE).map((p) => p.trim()));
      } else {
        out.push(part.trim());
      }
    }
  }
  return out;
}

/** Strip `>` quoting at every depth. */
function unquote(line: string): string {
  return line.replace(/^(\s*>)+\s?/, "").trim();
}

/** The HTML-to-text duplicates: a line the next one starts with, or one the line just kept
 * already contains. Short lines are never dropped this way. */
function dedupe(lines: readonly string[]): string[] {
  const kept: string[] = [];
  const nextNonBlank = (from: number) => lines.slice(from).find(Boolean) ?? "";
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) {
      kept.push("");
      continue;
    }
    const lower = line.toLowerCase();
    const next = nextNonBlank(i + 1).toLowerCase();
    const prev = [...kept].reverse().find(Boolean)?.toLowerCase() ?? "";
    if (line.length >= 8 && next.startsWith(lower) && next.length > lower.length) continue;
    if (prev && (prev === lower || (line.length >= 12 && prev.includes(lower)))) continue;
    kept.push(line);
  }
  return kept;
}

// ── Reading a header ─────────────────────────────────────────────────────────

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const TIME = /\b\d{1,2}[:.]\d{2}(?:\s?[AaPp]\.?[Mm]\.?|\s?Uhr|\s?h)?/g;
const YEAR = /\b(19|20)\d{2}\b/g;

function cleanName(value: string): string | null {
  const name = value
    .replace(EMAIL, "")
    .replace(/[<>()"]/g, "")
    .replace(/mailto:\S*/gi, "")
    .replace(/^[\s,;:]+|[\s,;:]+$/g, "")
    .replace(/\s{2,}/g, " ");
  return name || null;
}

/** `Fri, Sep 25, 2026 at 1:27 PM Gitty Greenfeld` → date and name, split after the last time
 * (or year). */
function splitDateName(rest: string): { date: string | null; name: string | null } {
  const times = [...rest.matchAll(TIME)];
  const years = [...rest.matchAll(YEAR)];
  const cut = times.at(-1) ?? years.at(-1);
  if (!cut || cut.index === undefined) return { date: null, name: cleanName(rest) };
  const end = cut.index + cut[0].length;
  return { date: rest.slice(0, end).replace(/[\s,]+$/, "").trim() || null, name: cleanName(rest.slice(end)) };
}

interface HeaderMeta {
  from: string | null;
  email: string | null;
  date: string | null;
}

/** Who and when, from a reply header line. */
export function readReplyHeader(header: string): HeaderMeta {
  const email = header.match(EMAIL)?.[0] ?? null;
  let m = header.match(/^On\s+(.+?)\bwrote\s?:/i) ?? header.match(/^El\s+(.+?)\bescribió\s?:/i) ?? header.match(/^Em\s+(.+?)\bescreveu\s?:/i);
  if (m) {
    const { date, name } = splitDateName(m[1]);
    return { from: name, email, date };
  }
  m = header.match(/^Le\s+(.+?)\ba\s+écrit\s?:/i) ?? header.match(/^Il\s+(?:giorno\s+)?(.+?)\bha\s+scritto\s?:/i);
  if (m) {
    const { date, name } = splitDateName(m[1]);
    return { from: name, email, date };
  }
  m = header.match(/^(?:Am|Op)\s+(.+?)\s+(?:schrieb|schreef)\s+(.+?):?\s*$/i);
  if (m) return { from: cleanName(m[2]), email, date: m[1].replace(/[\s,]+$/, "").trim() || null };
  return { from: null, email, date: null };
}

/** Who and when, from an Outlook `From:/Sent:` block. */
function readOutlookBlock(fields: readonly string[]): HeaderMeta {
  let from: string | null = null;
  let email: string | null = null;
  let date: string | null = null;
  for (const field of fields) {
    const [, key, value] = field.match(/^([^:]+):\s*(.*)$/) ?? [];
    if (!key) continue;
    if (/^(from|von|de|da|van)$/i.test(key.trim())) {
      email = value.match(EMAIL)?.[0] ?? null;
      from = cleanName(value);
    } else if (SENT_LINE.test(`${key}:`)) {
      date = value.trim() || null;
    }
  }
  return { from, email, date };
}

// ── Links ────────────────────────────────────────────────────────────────────

const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

/** `host/short-path` for a URL — never its query (tracking lives there) nor a token-like path. */
export function shortUrl(href: string): string {
  try {
    const url = new URL(href);
    if (url.protocol === "mailto:") return decodeURIComponent(url.pathname);
    const host = url.hostname.replace(/^www\./, "");
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return host;
    const first = segments[0];
    const tokenLike = first.length > 24 || /^[_-]/.test(first) || /[A-Za-z0-9_-]{25,}/.test(url.pathname);
    if (tokenLike) return host;
    const path = segments.slice(0, 2).join("/");
    const shown = path.length > 28 ? `${path.slice(0, 27)}…` : path;
    return `${host}/${shown}${segments.length > 2 ? "/…" : ""}`;
  } catch {
    return href.length > 40 ? `${href.slice(0, 39)}…` : href;
  }
}

/** Gmail links every address to a map; the address is the information, the link is noise. */
function isMapLink(href: string): boolean {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    return (/^google\.[a-z.]+$/.test(host) && url.pathname.startsWith("/maps")) || /^maps\.(google\.[a-z.]+|apple\.com)$/.test(host) || host === "goo.gl" && url.pathname.startsWith("/maps");
  } catch {
    return false;
  }
}

function looksLikeUrl(text: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(text.trim());
}

// One sweep: the first alternative that matches at a position wins, so the order is priority.
const INLINE = new RegExp(
  [
    /!\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)\)/.source, // 1-2: ![alt](url)
    /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/.source, // 3-4: [label](url)
    /\(\s*((?:https?:\/\/|mailto:)[^\s)]+)\s*\)/.source, // 5: (url)
    /<\s*((?:https?:\/\/|mailto:)[^\s>]+)\s*>/.source, // 6: <url>
    /(https?:\/\/[^\s<>()"']*[^\s<>()"'.,;:!?])/.source, // 7: bare url
    /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/.source, // 8: email
    /\b(www\.[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:\/[^\s<>()"']*[^\s<>()"'.,;:!?])?)/.source, // 9: www.
  ].join("|"),
  "g",
);

function linkToken(href: string, label: string, compact: boolean): InlineToken {
  if (/^mailto:/i.test(href)) {
    const address = href.replace(/^mailto:/i, "").split("?")[0];
    return { kind: "email", href: `mailto:${address}`, label: compact || looksLikeUrl(label) ? address : label };
  }
  return { kind: "link", href, label, compact };
}

/** One line of text as text, links, images and email addresses. */
export function tokenizeLine(line: string): MessageLine {
  // "Name < someone@example.com>" — the angle brackets are the mail client's, not the sender's.
  const text = line
    .replace(/<\s*([^\s<>@]+@[^\s<>]+?)\s*>/g, "$1")
    // "213.765.0462 (tel:(213)%20765-0462)" — the number is already written; drop the link.
    .replace(/\s*\(tel:[^\s]*?\)(?=[\s.,;:!?]|$)/gi, "");
  const out: InlineToken[] = [];
  let last = 0;
  const pushText = (value: string) => {
    if (!value) return;
    const prev = out[out.length - 1];
    if (prev?.kind === "text") prev.text += value;
    else out.push({ kind: "text", text: value });
  };
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    pushText(text.slice(last, at));
    last = at + match[0].length;
    const [, alt, imageHref, label, linkHref, parenHref, angleHref, bareHref, email, www] = match;
    if (imageHref) {
      out.push({ kind: "image", href: imageHref, label: alt?.trim() || "Image" });
    } else if (linkHref) {
      if (isMapLink(linkHref)) {
        pushText(label);
        continue;
      }
      const shown = looksLikeUrl(label) ? shortUrl(/^https?:/i.test(label) ? label : `https://${label}`) : label.trim();
      out.push(linkToken(linkHref, shown, false));
    } else if (parenHref || angleHref) {
      const href = (parenHref || angleHref) as string;
      if (!isMapLink(href)) out.push(linkToken(href, shortUrl(href), true));
    } else if (bareHref) {
      if (!isMapLink(bareHref)) out.push(linkToken(bareHref, shortUrl(bareHref), true));
    } else if (email) {
      out.push({ kind: "email", href: `mailto:${email}`, label: email });
    } else if (www) {
      out.push(linkToken(`https://${www}`, shortUrl(`https://${www}`), false));
    }
  }
  pushText(text.slice(last));
  // Removing a map link leaves "street  " — tidy the spacing it leaves behind.
  const tidy = out.map((token) => (token.kind === "text" ? { ...token, text: token.text.replace(/[ \t]{2,}/g, " ") } : token));
  return tidy.filter((token) => (token.kind === "text" ? token.text.trim().length > 0 || tidy.length > 1 : SAFE_HREF.test(token.href)));
}

// ── Order emails as a receipt (SPEC-348 §1c) ─────────────────────────────────

const LABEL_NAMES =
  "Billing Address|Shipping Address|Delivery Address|Order Details|Order Summary|Payment Method|Shipping Method|Sub-?total|Shipping|Delivery|Discount|Taxes|Tax|Total|Quantity|Qty|Price";
/** A known label with its colon, optionally with a parenthesised note: `Discount (code: X):`. */
const LABEL_AT = new RegExp(`^(${LABEL_NAMES})\\b\\s*(\\([^)]*\\))?\\s*:`, "i");
/** The same label in the middle of a line, or "Shop by" — where a new line should start. */
const LABEL_INSIDE = new RegExp(`(?<=\\S)\\s+(?=(?:(?:${LABEL_NAMES})\\b\\s*(?:\\([^)]*\\))?\\s*:|Shop by\\b))`, "gi");

const ADDRESS_LINE = /^(billing|shipping|delivery)\s+address\s*:\s*(.*)$/i;
const ORDER_HEADING = /^order\s+(details|summary)\s*:?\s*$/i;
const QUANTITY_LINE = /^(quantity|qty)\s*:\s*(.+)$/i;
const ITEM_TOTAL_LINE = /^(total|price)\s*:\s*(.+)$/i;
const TOTALS_LINE = /^((?:sub-?total|shipping|delivery|discount|taxes|tax|total)\b\s*(?:\([^)]*\))?)\s*:\s*(.+)$/i;

/** Split every line at the labels run into it, so each label starts its own line. */
function splitLabels(lines: readonly string[]): string[] {
  return lines.flatMap((line) => (line ? line.split(LABEL_INSIDE).map((part) => part.trim()).filter(Boolean) : [line]));
}

/** `DISCOUNT (code: PPM-x)` → `Discount (code: PPM-x)`: the label in sentence case, any note
 * in brackets (a discount code) exactly as written. */
function titleCase(label: string): string {
  const at = label.indexOf("(");
  const word = (at >= 0 ? label.slice(0, at) : label).trim().toLowerCase();
  const note = at >= 0 ? ` ${label.slice(at).trim()}` : "";
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}${note}`;
}

/** An order from `start`: items (name, Quantity, Total) then totals. Returns the block and the
 * line after it, or null when no item is there. */
function readOrder(lines: readonly string[], start: number): { block: MessageBlock; next: number } | null {
  const items: OrderItem[] = [];
  const totals: OrderTotal[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) {
      // A blank line ends the order once its totals have started.
      if (totals.length) break;
      i += 1;
      continue;
    }
    const quantity = lines[i + 1]?.match(QUANTITY_LINE);
    if (!totals.length && !LABEL_AT.test(line) && quantity) {
      const price = lines[i + 2]?.match(ITEM_TOTAL_LINE);
      items.push({ name: line, quantity: quantity[2].trim(), total: price ? price[2].trim() : null });
      i += price ? 3 : 2;
      continue;
    }
    const total = line.match(TOTALS_LINE);
    if (total && items.length) {
      totals.push({ label: titleCase(total[1]), value: total[2].trim(), grand: false });
      i += 1;
      continue;
    }
    break;
  }
  if (!items.length) return null;
  const grand = totals.map((t) => t.label.toLowerCase()).lastIndexOf("total");
  if (grand >= 0) totals[grand].grand = true;
  return { block: { kind: "order", items, totals }, next: i };
}

/** Lines into blocks: addresses and orders where the email has them, paragraphs otherwise —
 * blank lines separate paragraphs, runs of blank lines count once. */
function blocks(rawLines: readonly string[]): MessageBlock[] {
  const lines = splitLabels(rawLines);
  const out: MessageBlock[] = [];
  let current: MessageLine[] = [];
  const flush = () => {
    if (current.length) out.push({ kind: "paragraph", lines: current });
    current = [];
  };
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (!line) {
      flush();
      i += 1;
      continue;
    }
    const address = line.match(ADDRESS_LINE);
    if (address) {
      flush();
      const body = address[2] ? [address[2]] : [];
      let j = i + 1;
      while (j < lines.length && lines[j] && !LABEL_AT.test(lines[j]) && !ORDER_HEADING.test(lines[j]) && body.length < 6) {
        body.push(lines[j]);
        j += 1;
      }
      out.push({ kind: "address", title: `${titleCase(address[1])} address`, lines: body });
      i = j;
      continue;
    }
    const heading = ORDER_HEADING.test(line);
    const order = readOrder(lines, heading ? i + 1 : i);
    if (order && (heading || QUANTITY_LINE.test(lines[i + 1] ?? ""))) {
      flush();
      out.push(order.block);
      i = order.next;
      continue;
    }
    const tokens = tokenizeLine(line);
    if (tokens.some((t) => t.kind !== "text" || t.text.trim())) current.push(tokens);
    i += 1;
  }
  flush();
  return out;
}

// ── The whole message ────────────────────────────────────────────────────────

/** A whitespace-insensitive key, to compare the helpdesk's stripped copy with the body. */
function squash(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Where the history starts, by the helpdesk's own stripped copy when it lines up. */
function splitByStripped(lines: readonly string[], stripped: string): number | null {
  const target = squash(stripped);
  if (!target) return null;
  let acc = "";
  for (let i = 0; i < lines.length; i += 1) {
    acc = squash(`${acc} ${lines[i]}`);
    if (acc === target) return i + 1;
    if (!target.startsWith(acc)) return null;
  }
  return null;
}

function section(lines: readonly string[]): { body: MessageBlock[]; footer: MessageBlock[] } {
  const { body, footer } = splitFooter(splitLabels(dedupe(lines)));
  return { body: blocks(body), footer: blocks(footer) };
}

/** The quoted history (already unquoted) as separate messages, cut at every header. */
function earlierMessages(lines: readonly string[]): EarlierMessage[] {
  const out: EarlierMessage[] = [];
  let meta: HeaderMeta = { from: null, email: null, date: null };
  let buffer: string[] = [];
  const flush = () => {
    const { body, footer } = section(buffer);
    if (body.length || footer.length) out.push({ ...meta, body, footer });
    buffer = [];
  };
  for (let i = 0; i < lines.length; ) {
    const span = replyHeaderAt(lines, i);
    if (span) {
      flush();
      meta = readReplyHeader(lines.slice(i, i + span).join(" "));
      i += span;
      continue;
    }
    if (ORIGINAL_MESSAGE.test(lines[i]) || UNDERSCORE_RULE.test(lines[i])) {
      i += 1;
      continue;
    }
    if (outlookBlockAt(lines, i)) {
      flush();
      let end = i;
      while (end < lines.length && OUTLOOK_FIELD.test(lines[end])) end += 1;
      meta = readOutlookBlock(lines.slice(i, end));
      i = end;
      continue;
    }
    buffer.push(lines[i]);
    i += 1;
  }
  flush();
  return out;
}

/**
 * The message as the thread draws it: the new words and their footer, and every earlier
 * message underneath as its own entry. When the helpdesk supplies its own quote-stripped copy
 * and it lines up with the body, it decides where the history starts; otherwise the reply
 * headers, `>` quoting and Outlook blocks do. A message that is nothing but history shows its
 * first quoted message as the new words — the thread never hides everything a sender wrote.
 */
export function parseMessageBody(body: string, strippedBody?: string | null): ParsedMessage {
  const lines = unflatten(normaliseLines(body ?? ""));
  let split = strippedBody ? splitByStripped(lines, strippedBody) : null;
  if (split === null) {
    split = lines.length;
    for (let i = 0; i < lines.length; i += 1) {
      if (startsHistory(lines, i)) {
        split = i;
        break;
      }
    }
  }
  const head = section(lines.slice(0, split));
  const earlier = earlierMessages(lines.slice(split).map(unquote));
  if (!head.body.length && !head.footer.length && earlier.length) {
    const [first, ...rest] = earlier;
    return { visible: first.body, footer: first.footer, earlier: rest };
  }
  return { visible: head.body, footer: head.footer, earlier };
}

/** `2.4 MB`, `820 KB`, `512 B` — for an attachment chip; empty when unknown. */
export function formatBytes(size: number | null | undefined): string {
  if (size === null || size === undefined || !Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** What an attachment is, for its icon and whether it gets a thumbnail. */
export function attachmentKind(contentType: string | null | undefined, name: string): "image" | "pdf" | "file" {
  const type = (contentType ?? "").toLowerCase();
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "heic"].includes(ext)) return "image";
  if (type === "application/pdf" || ext === "pdf") return "pdf";
  return "file";
}

/** The initial for an earlier message's avatar. */
export function senderInitial(message: Pick<EarlierMessage, "from" | "email">): string {
  return (message.from ?? message.email ?? "?").trim().charAt(0).toUpperCase() || "?";
}
