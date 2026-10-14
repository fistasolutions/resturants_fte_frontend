"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FaqItem } from "@/types/spotlight";

/**
 * The visible FAQ (backend SPEC-124), rendered as a real accordion from the
 * draft's derived `faq`. Doubles as the on-page AEO block (question → answer
 * structure for answer engines). Hidden when there are no Q&A pairs (never faked).
 *
 * Was native `<details>` (SPEC-124) — a deliberate no-dependency choice, but it
 * gave no open/close animation and let every panel sit open at once, so the block
 * sprawled. Now single-open with an animated body (SPEC-165).
 *
 * The animation uses a `grid-template-rows: 0fr → 1fr` transition: it animates to
 * the content's OWN height with no hardcoded pixel value and no JS measurement,
 * so a long answer and a one-liner both animate correctly. 200ms — this is
 * expand/collapse on interaction, which root Rule 9 allows; nothing animates on
 * load.
 *
 * Leaving `<details>` means the accessibility has to be rebuilt deliberately:
 * each row is a real `<button>` carrying `aria-expanded` and `aria-controls`, and
 * the panel is a `region` labelled by its button.
 *
 * `id` anchors the section to its `toc` slug so the table of contents can jump to
 * it, even though the FAQ is lifted out of the prose Markdown.
 */
export function BlogFaq({ items, id }: { items: FaqItem[]; id?: string }) {
  // Single-open: opening one closes the other. `null` = all closed, which is the
  // initial state so the block reads as a compact index of questions.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  if (items.length === 0) return null;

  return (
    <section
      id={id}
      className="mt-10 scroll-mt-24 border-t border-border pt-8"
      aria-label="Frequently asked questions"
    >
      <h2 className="font-heading text-xl tracking-tight text-foreground">
        Frequently asked questions
      </h2>
      <div className="mt-4 divide-y divide-border overflow-hidden rounded-card border border-border">
        {items.map((item, index) => {
          const open = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;
          return (
            <div key={index} className={cn("bg-card", open && "bg-muted/30")}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:-outline-offset-2"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      open && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
              </h3>
              {/* grid-rows 0fr -> 1fr animates to the content's own height —
                  no magic pixel max-height that clips a long answer. */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
