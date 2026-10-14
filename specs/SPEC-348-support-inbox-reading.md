# SPEC-348 — Support Inbox: messages read like an email client, nothing scrolls sideways, switching a queue keeps the page

**Status:** implemented 2026-10-07 · **Repo:** frontend (backend SPEC-357 supplies attachments) ·
**Builds on:** SPEC-346-customer-support-agent.md, SPEC-301 (`ShallowLink`)

## Why

Owner (2026-10-07), on Customer Support → Inbox, with screenshots of a real thread:

- "I want the best parsing of the message conversation I get or send. If any link, make sure
  it's in the form of a link; any attachment must be shown the best way."
- "See the horizontal scrolling issue on this page — fix it."
- The queue chips are cut off. "Make it vertically scrollable or a beautiful tag-type UI."
- "As I change any of these options the full page, full UI loads — I want the page not to
  re-render, just render the information."

The thread showed raw email text:

- each reply carried the whole earlier exchange (`On … wrote:`, `Am … schrieb …:`, `>` lines);
- signature and footer links printed as 300-character tracking URLs;
- markdown-style links like `[www…](http://…)` and `![](…)` appeared as text.

The long URLs pushed the bubble past the page, so the page scrolled sideways.

## What changes

### 1. One parser for every message (`lib/message-body.ts`, pure, unit-tested)

`parseMessageBody(body, strippedBody?)` returns `{ visible, quoted }`, each a list of
paragraphs made of inline tokens.

**Splitting the visible text from the earlier history.** The quoted history starts at the first
of these markers:

- a reply header, including one wrapped over two lines:

  | Language | Pattern |
  | --- | --- |
  | English | `On … wrote:` |
  | German | `Am … schrieb …:` |
  | French | `Le … a écrit :` |
  | Spanish | `El … escribió:` |
  | Dutch | `Op … schreef …:` |
  | Italian | `Il … ha scritto:` |
  | Portuguese | `Em … escreveu:` |

- `-----Original Message-----`, or an underscore rule followed by `From:`;
- an Outlook `From: … Sent: …` block;
- a run of `>` lines;
- a `-- ` signature delimiter, or `Sent from my iPhone` / `Sent from my Android` and similar
  mobile signatures.

When the helpdesk supplies `strippedBody` and it is a prefix of the body, it decides the split
instead.

**Inline tokens:**

| Token | Shown as |
| --- | --- |
| `[label](url)` | the label as a link (a URL-like label is shortened) |
| `![alt](url)` | an "Image" link chip |
| `(https://…)` and `<https://…>` | a compact link chip showing the host and a shortened path |
| bare `http(s)://` URLs | the same compact link chip |
| `mailto:` and bare email addresses | mail links |

Tracking parameters (`utm_*`, `fbclid`, `gclid`, `mc_*`) are dropped from what is shown, never
from the link itself. Links open in a new tab with `rel="noopener noreferrer nofollow"`.

**Whitespace:** trailing spaces go, indentation from HTML-to-text conversion goes, and more than
one blank line collapses to one.

### 2. Thread rendering (`features/customer-support/inbox/thread.tsx` + `message-body.tsx`)

- The visible part renders as paragraphs. The quoted part sits behind "Show earlier messages"
  (`<details>`), collapsed by default.
- Attachments render as chips under the message: a file-type icon, the name, the size, and a
  thumbnail for images (lazy, `referrerPolicy="no-referrer"`). Each opens in a new tab.
- Internal notes use the same renderer.
- Every bubble and paragraph is `min-w-0` with `overflow-wrap:anywhere`, so no token can widen
  the page.

### 3. No sideways scroll

The conversation column and its children carry `min-w-0`, so the grid's `minmax(0, 1fr)` can
shrink. The context panel's long values wrap.

### 4. Queue chips as tags

The seven queues wrap as tag pills over as many rows as needed, instead of being cut off in one
row. Each pill shows its count; the active one is filled.

### 5. Switching a queue keeps the page

- The inbox query keeps the previous page on screen (`placeholderData: keepPreviousData`) while
  the next one loads. Only the list dims, with `aria-busy`. The chips, the sort, the open
  conversation and the context panel stay put. The whole-tab skeleton shows only on the very
  first load.
- Hovering or focusing a queue chip prefetches that queue, so the switch is usually instant.
- Changing the sort and the page work the same way.

### 1b. The history reads as messages, not one block (owner, with a screenshot)

Opened, the history showed one wall of text: two quoted emails run together, every
HTML-to-text duplicate ("THANK you FOR SHOPPING!" twice, "Order Details:" twice), Gmail's
Google Maps link after every address line, and the store's marketing footer. Now:

- **Earlier messages:** `parseMessageBody` returns `earlier`, one entry per quoted message. The
  history is cut at every reply header, after unquoting `>` at every depth, and at every Outlook
  `From:/Sent:` block. Each entry carries `from`, `email` and `date`, read from its header (time-
  or year-split for "On … wrote:"; verb-split for "schrieb"/"schreef"), plus its own `body` and
  `footer`. The thread draws each one as a card with the sender, the address and the date,
  behind "Show N earlier messages".
- **Duplicates:** a line is dropped when the next line starts with it, or when the line just kept
  already contains it (the HTML-to-text copies). Short lines (under 8 or 12 characters) are never
  dropped this way.
- **Footers:** from the first footer line onward — `©`, "All rights reserved", unsubscribe,
  "Follow us", "Stay in the loop", "Need support?", "Download … app", "Join our", "Shop by",
  "Orders sold through", "View in browser", a `-- ` signature or "Sent from my iPhone" — the rest
  of that message is folded behind a small "···" toggle, for the new words and for every earlier
  message. A footer line only counts once there is content before it.
- **Map links:** a Google Maps or Apple Maps link (Gmail adds one to every address) is dropped;
  the address stays as text.

### 1c. Order emails read as a receipt (owner, with a screenshot)

Quoted order confirmations read as loose lines, with labels run together: "…641682. Billing
Address: Yocheved Zimmerman", "United States Shipping Address: …", and "Total: $59.00 Discount
(code: PPM-…): -$25.00 Subtotal: $171.00 Shipping: $0.00 Total: $171.00 SHOP by STYLE:".

A section's content is now a list of **blocks**, not only paragraphs:

1. **Labels split.** A known label in the middle of a line starts a new line. The labels are
   Billing/Shipping/Delivery Address, Order Details/Summary, Subtotal, Shipping, Delivery,
   Discount (with its parenthesised code), Tax(es), Total, Quantity/Qty, Price, Payment/Shipping
   Method, and "Shop by". A label needs its colon, so ordinary sentences are left alone.
2. **`address` block:** a "Billing / Shipping / Delivery Address:" line and the lines after it,
   up to a blank or another label (at most 6), drawn as a small titled address card.
3. **`order` block:** it starts at "Order Details/Summary:", or at any line followed by a
   "Quantity:" line.
   - Each item is a name, then its Quantity, then its Total or Price.
   - The totals that follow (Subtotal, Shipping, Discount (code: …), Tax, Total) are rows.
   - The last Total is the grand total.
   - The block is drawn as a table (Item · Qty · Total) with a right-aligned totals summary, the
     grand total in bold, and figures in tabular numerals.
4. Everything else stays a paragraph, with its links and emails as before.

### 1e. Flattened emails (owner, with a screenshot of a PR agency thread)

Some helpdesk bodies arrive with the line breaks lost: the new words, the signature and three
earlier emails ("… Instagram: @CLDStyle On Thu, Oct 1, 2026 at 7:00 AM CLD PR contact@… wrote:
Hi, …") on a handful of very long lines. Phone numbers showed as `(tel:(310)%20403-6929)`, and an
"Unsubscribe" deep inside a long line folded the whole rest of the message behind "···". Now:

- **Mid-line headers.** Before anything else, a reply header in the middle of a line starts a
  new line, and the text after its `wrote:` (or `schrieb …:`) starts another. Handled: English
  `On <weekday|day|month> … wrote:`, and German `Am <Mo|Di|…> … schrieb …:`. Outlook
  `From: … Sent:` run into a line is split the same way. The history then splits into earlier
  messages as usual.
- **Phone links.** `(tel:…)` after a number is dropped, since the number is already written
  before it.
- **`www.` addresses** become links.
- **Footers.** A footer marker only counts on a line of at most 200 characters. A marker buried
  in a long line is content, not a footer.

### 1d. One renderer for every message in the agent (owner, with an Approvals screenshot)

"The customer wrote" in Approvals still printed the raw body, with the whole history, the map
URLs and the tracking links. `MessageBody` moves to `features/customer-support/message-body.tsx`
and is the only way the Customer Support Agent draws message text:

- Inbox thread messages and the reply box's draft preview;
- Approvals: "The customer wrote" in the pre-send panel, the agent's draft on each card, and
  the draft in the send-confirm dialog;
- Topics → test bench: the customer message, the draft, and the reply sent at the time.

The agent's own drafts have no history and no footer, so they render as plain paragraphs with
live links. A new surface uses this renderer too, never `whitespace-pre-line` on a body.

### 6. Opening a ticket keeps the page too

Owner, after §5 shipped: clicking a ticket still swapped the conversation and the context panel
for skeletons. Now:

- The ticket query keeps the open conversation on screen (`placeholderData: keepPreviousData`)
  until the next one arrives. It is dimmed, with `aria-busy`, a thin progress bar on top, and
  nothing clickable. The skeleton shows only when no ticket has loaded yet.
- Hovering or focusing a ticket row prefetches that ticket. Once a ticket is open, its two
  neighbours (j / k) are prefetched, so moving through the queue is usually instant.
- The conversation pane is keyed by ticket id, so a draft being edited never carries over to the
  next ticket.

**What FOC sees (Rule 12):** changed because the owner asked, while reviewing FOC's own threads. Messages read like an email client, and switching a queue or a ticket keeps the page. No setting or data changes.

## Acceptance criteria

1. A reply with an `On … wrote:` (or German `Am … schrieb`) history shows only the new text,
   with "Show earlier messages" revealing the rest.
2. `[text](url)`, `![](url)`, `(https://…)` and bare URLs render as links with short labels,
   and no raw tracking URL is printed.
3. Attachments show as chips with an image thumbnail where possible.
4. At 1280px and 390px, the Inbox never scrolls horizontally, whatever the message contains.
5. All seven queue chips are visible (wrapped) in the queue column.
6. Switching a queue, the sort or the page never replaces the tab with a skeleton; only the list
   updates.
7. `npm test` (new `tests/message-body.test.ts`), `npx tsc --noEmit`, lint on the touched files,
   and `npm run build` are green.

## Manual verification checklist

- Open the screenshot's ticket. Mindy's replies show one short message each, the footer links
  are compact chips, and there is no sideways scrollbar.
- Click every queue chip. The page stays, and only the list changes.
- Open a ticket that has an image attachment: the thumbnail chip opens the file.
