/**
 * Pure helpers for the answer card (SPEC-240): the header strip's two labels and
 * the chip prefixes. Unit-tested in node; the component only renders them.
 */
import { modelLabel } from "@/lib/ai-providers";
import { isInAppHref } from "@/lib/answer-markdown";
import type { AnswerAction, ChatSourceChip, ChatSources } from "@/types/chat";

export type PillTone = "ok" | "muted" | "working";

export interface GroundedPill {
  tone: PillTone;
  label: string;
}

/** The right-hand pill of the header strip. */
export function groundedPill(sources: ChatSources | null | undefined, streaming: boolean): GroundedPill {
  if (streaming) return { tone: "working", label: "Reading records…" };
  if (sources?.grounded && sources.systems.length > 0) {
    return { tone: "ok", label: `Grounded · ${sources.systems.join(", ")}` };
  }
  if (sources?.grounded) return { tone: "ok", label: "Grounded · store records" };
  return { tone: "muted", label: "Conversational · no records read" };
}

/** "Runtime · Gemini Pro (latest)" — the model that answered (the override, else
 * the system default), with the temperature when one was set. */
export function runtimeLabel(
  model: string | null | undefined,
  temperature: number | null | undefined,
  defaultModel: string | null | undefined,
): string {
  const id = model ?? defaultModel;
  if (!id) return "Runtime · Glisp";
  const temp = temperature === null || temperature === undefined ? "" : ` · t ${temperature}`;
  return `Runtime · ${modelLabel(id)}${temp}`;
}

const CHIP_PREFIX: Record<ChatSourceChip["kind"], string> = {
  page: "Page",
  product: "Product",
  order: "Order",
  location: "Store",
};

export function chipPrefix(kind: ChatSourceChip["kind"]): string {
  return CHIP_PREFIX[kind] ?? "Record";
}

/**
 * The buttons that close an answer (SPEC-352): the pages that act on it (`actions`,
 * SPEC-260) and the screens it points to (`link` cards, SPEC-346), as one list — in-app
 * paths only, one per href, actions first.
 */
export function answerLinks(sources: ChatSources | null | undefined): AnswerAction[] {
  const links: AnswerAction[] = [];
  const seen = new Set<string>();
  const add = (label: string, href: string, kind: AnswerAction["kind"]) => {
    if (seen.has(href)) return;
    seen.add(href);
    links.push({ label, href, kind });
  };
  for (const action of sources?.actions ?? []) {
    if (isInAppHref(action.href)) add(action.label, action.href, action.kind === "send" ? "send" : "review");
  }
  for (const card of sources?.cards ?? []) {
    if (card.kind === "link" && isInAppHref(card.href)) add(card.label || "Open", card.href, "review");
  }
  return links;
}
