"use client";

import { isValidElement, useMemo, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import {
  firstParagraphLineNumber,
  headingIdsByLine,
  isExternalHref,
  slugifyHeading,
} from "@/lib/spotlight";

/**
 * Article-grade Markdown for a Spotlight blog draft's `body_md` (backend
 * SPEC-109; rich reading experience SPEC-124). react-markdown ignores raw HTML
 * by default (no `rehype-raw`, no `dangerouslySetInnerHTML`), so the
 * agent-authored body renders safely as elements.
 *
 * Rich reading treatment (SPEC-124): the first body paragraph gets a drop-cap,
 * `## H2` headings carry slugified anchor ids that match the draft's `toc` (so
 * the sticky table of contents can jump to them), and Markdown blockquotes
 * render as large editorial pull quotes. App tokens only; `font-heading` for the
 * editorial serif accents, body prose stays in the readable base font.
 *
 * Deterministic across SSR + client (SPEC-126): heading ids and the drop-cap are
 * derived once from the `content` string (via `headingIdsByLine` /
 * `firstParagraphLineNumber`) and keyed off each node's stable source line —
 * react-markdown passes the parsed hast `node` with `node.position.start.line`.
 * No render-time mutable counters, so ids/drop-cap never diverge between server
 * and client (which previously caused a hydration mismatch). Outbound external
 * links render as plain muted citations, not clickable links (SPEC-126).
 */

/** Recursively collect the plain text of a heading's children so it can be
 * slugified into a stable anchor id (matches the backend `toc` id). */
function childrenToText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(childrenToText).join("");
  if (isValidElement(children)) {
    const props = children.props as { children?: ReactNode };
    return childrenToText(props.children);
  }
  return "";
}

/** Build the renderer map from decisions pre-computed once from the source
 * Markdown: `headingIds` maps a heading's source line → its anchor id, and
 * `firstParagraphLine` is the line that gets the drop-cap. Both are keyed off
 * `node.position.start.line`, which is identical on server and client, so the
 * output is deterministic (no hydration mismatch). */
function buildComponents(
  enableDropCap: boolean,
  headingIds: Map<number, string>,
  firstParagraphLine: number | null,
  headingIdOverride?: string,
): Components {
  return {
    h1: ({ children }) => (
      <h2 className="font-heading mt-8 mb-3 text-2xl tracking-tight text-foreground first:mt-0">
        {children}
      </h2>
    ),
    h2: ({ children, node }) => {
      const line = node?.position?.start?.line;
      // A section rendered on its own (SPEC-150) passes the pre-computed anchor id
      // for its single H2 so ids stay globally consistent with `draft.toc` even
      // for duplicate headings; otherwise fall back to the line-keyed map.
      const id =
        headingIdOverride ??
        (line !== undefined ? headingIds.get(line) : undefined) ??
        slugifyHeading(childrenToText(children));
      return (
        <h2
          id={id}
          className="font-heading mt-10 mb-3 scroll-mt-24 text-xl tracking-tight text-foreground first:mt-0"
        >
          {children}
        </h2>
      );
    },
    h3: ({ children }) => (
      <h3 className="mt-6 mb-2 text-base font-semibold text-foreground first:mt-0">
        {children}
      </h3>
    ),
    p: ({ children, node }) => {
      const isFirst =
        firstParagraphLine !== null &&
        node?.position?.start?.line === firstParagraphLine;
      return (
        <p
          className={cn(
            "mb-4 leading-relaxed text-foreground/90 last:mb-0",
            enableDropCap &&
              isFirst &&
              "first-letter:font-heading first-letter:mt-1 first-letter:mr-2.5 first-letter:float-left first-letter:text-6xl first-letter:leading-[0.72] first-letter:text-foreground",
          )}
        >
          {children}
        </p>
      );
    },
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className="mb-4 list-disc space-y-1.5 pl-6 leading-relaxed text-foreground/90 last:mb-0">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-1.5 pl-6 leading-relaxed text-foreground/90 last:mb-0">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    // Defensive external-link handling (SPEC-126): outbound links are stripped
    // server-side, but the live refine stream can still surface a raw
    // `[domain](https://…)` — render it as a plain muted citation, never a
    // clickable outbound link. Internal / relative / anchor links stay links.
    a: ({ href, children }) =>
      href && isExternalHref(href) ? (
        <span className="text-muted-foreground">{children}</span>
      ) : (
        <a
          href={href}
          // `--primary` is brand ink (#1a1b18), so colour alone does not read as
          // a link (SPEC-165). Brand red is identity-only (root Rule 9) and would
          // collide with `--destructive`, so the affordance comes from a visible,
          // thickening underline instead of a new colour.
          className="font-medium text-primary underline decoration-primary/40 decoration-2 underline-offset-4 transition-colors hover:decoration-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
    // Editorial pull quote (SPEC-124): the POV line is stripped server-side, so a
    // body blockquote is a genuine highlight — render it large + accented.
    blockquote: ({ children }) => (
      <blockquote className="font-heading my-8 border-l-2 border-primary/40 pl-5 text-xl leading-snug tracking-tight text-foreground italic md:text-2xl">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded-sm bg-secondary px-1 py-0.5 font-mono text-sm">
        {children}
      </code>
    ),
    hr: () => <hr className="my-6 border-border" />,
  };
}

export function BlogMarkdown({
  content,
  enableDropCap = false,
  headingId,
  size = "base",
}: {
  content: string;
  enableDropCap?: boolean;
  /** SPEC-150: force the anchor id of this fragment's single `## H2` (used when a
   * section is rendered on its own so ids still match `draft.toc`). */
  headingId?: string;
  /** SPEC-153: `"lg"` renders the prose one step larger for the L5 centered
   * reading column; `"base"` (default) keeps the original size — backward
   * compatible for every existing caller. */
  size?: "base" | "lg";
}) {
  // Derive ids + the drop-cap line once per `content` (stable across renders and
  // across SSR/client), then key the renderers off each node's source line.
  const components = useMemo(
    () =>
      buildComponents(
        enableDropCap,
        headingIdsByLine(content),
        firstParagraphLineNumber(content),
        headingId,
      ),
    [content, enableDropCap, headingId],
  );

  return (
    <div className={size === "lg" ? "text-[1.0625rem] leading-relaxed" : "text-[0.95rem]"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
