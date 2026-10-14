import { isValidElement, type ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { isInAppHref, looksNumeric, normalizeAnswerMarkdown } from "@/lib/answer-markdown";
import { LEAD_PARAGRAPH_CLASS } from "@/lib/chat-lead";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** The visible text of a rendered cell — enough to tell a figure from a word. */
function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return "";
}

/**
 * Compact, token-styled Markdown for AI chat replies (react-markdown ignores
 * raw HTML by default, so agent output is safe to render).
 */
/**
 * Every element a reply can contain, on one scale (SPEC-304). Before this, only `h3`,
 * `p`, `strong`, lists, tables and inline code were styled — a reply that opened with
 * `## Where you stand`, quoted a figure or fenced a block rendered with the browser's
 * defaults inside a `text-sm` card: a 32-pixel heading and an unstyled link.
 */
export const CHAT_MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mt-4 mb-2 text-base font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-1.5 text-[0.95rem] font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 mb-1 text-sm font-medium text-muted-foreground first:mt-0">{children}</h4>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  // SPEC-352: a page of this app opens in place; only an outside link opens a new tab.
  a: ({ children, href }) =>
    isInAppHref(href) ? (
      <Link
        href={href}
        prefetch={false}
        className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
      >
        {children}
      </Link>
    ) : (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-medium underline underline-offset-2 hover:text-foreground"
      >
        {children}
      </a>
    ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-border pl-3 text-sm text-muted-foreground italic last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-border" />,
  // A fenced block scrolls inside the card; the card never widens to fit it.
  pre: ({ children }) => (
    <pre className="scrollbar-subtle mb-2 overflow-x-auto rounded-lg border border-border bg-secondary/50 p-3 font-mono text-xs leading-relaxed last:mb-0">
      {children}
    </pre>
  ),
  p: ({ children }) => (
    <p className="mb-2 text-sm leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-sm leading-relaxed last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  // shadcn's Table already renders its own `w-full overflow-x-auto` container,
  // so this passes the spacing through rather than nesting a second scroller.
  // A wide reply (the support agent leaderboard is 13 columns) scrolls inside
  // this box; the page itself must never scroll sideways.
  //
  // SPEC-352: the table sits in the app's table frame — a 12px bordered box with a muted
  // header — and a cell holding a figure is right-aligned on tabular numerals.
  table: ({ children }) => (
    <div className="mb-3 overflow-hidden rounded-xl border border-border last:mb-0" data-answer-table>
      <Table containerClassName="scrollbar-subtle">{children}</Table>
    </div>
  ),
  thead: ({ children }) => <TableHeader className="bg-muted/50">{children}</TableHeader>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children, style }) => (
    <TableHead style={style} className="h-9 px-3 text-xs font-medium whitespace-nowrap text-muted-foreground">
      {children}
    </TableHead>
  ),
  td: ({ children, style }) => (
    <TableCell
      style={style}
      className={cn(
        "px-3 py-2 align-top whitespace-normal",
        looksNumeric(nodeText(children)) && "text-right whitespace-nowrap tabular-nums",
      )}
    >
      {children}
    </TableCell>
  ),
  // Inline code gets its own chip; code inside a fence is already boxed by `pre`, so it
  // renders plain rather than doubling the background.
  code: ({ children, className }) => {
    const fenced = typeof className === "string" && className.startsWith("language-");
    return fenced ? (
      <code className="font-mono text-xs">{children}</code>
    ) : (
      <code className="rounded-sm bg-secondary px-1 py-0.5 font-mono text-xs">{children}</code>
    );
  },
};

/** Kept for the existing imports in this file. */
const components = CHAT_MARKDOWN_COMPONENTS;

export function ChatMarkdown({
  content,
  lead = false,
}: {
  content: string;
  /**
   * Promote the opening sentence (SPEC-222). Opt-in: this component also renders
   * daily reports, returns action plans and inventory commentary, whose first
   * paragraph is not an answer to anything.
   */
  lead?: boolean;
}) {
  const markdown = (
    // remark-breaks: single newlines = line breaks (chat convention) so
    // plain-text-ish agent output never mashes into one paragraph.
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
      {normalizeAnswerMarkdown(content)}
    </ReactMarkdown>
  );
  // A wrapper, not a conditional `p` renderer: react-markdown gives a component
  // no reliable notion of its own index among siblings.
  return lead ? <div className={LEAD_PARAGRAPH_CLASS}>{markdown}</div> : markdown;
}
