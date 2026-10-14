"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useOptionalChatDrawer } from "@/features/chat/chat-drawer-provider";
import { pageContextFor } from "@/lib/chat-context";
import { isChatDrawerShortcut, shortcutLabel } from "@/lib/chat-drawer-prompts";
import {
  bubblePosition,
  isIgnoredSelectionTarget,
  normaliseSelection,
  selectionQuestion,
  withSelection,
  type Rect,
} from "@/lib/selection-ask";
import { dateToISO } from "@/utils/date";
import { GlispIcon } from "@/components/shared/glisp-icon";

const DEBOUNCE_MS = 120;
/** Estimate until the bubble has been measured once. */
const ESTIMATED = { width: 96, height: 28 };

interface Live {
  text: string;
  rect: Rect;
}

/**
 * Select anything, ask about it (SPEC-243). Mounted once in the app layout:
 * watches the document's selection and, when the owner has highlighted real
 * text outside the Ask Glisp panel and any editable field, shows a small
 * "Ask Glisp" bubble above it. Clicking it — or pressing the drawer shortcut
 * while text is selected — opens the drawer and drafts the question into its
 * composer with page context plus `selection` (backend SPEC-250). It never
 * sends: the owner reads the question, edits it if they like, and sends it
 * themselves (SPEC-243 Patches 2026-09-22 — the same path as ✦ Explain).
 */
export function SelectionAsk() {
  const drawer = useOptionalChatDrawer();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const suppressed = !drawer || drawer.suppressed;

  const [live, setLive] = useState<Live | null>(null);
  const [size, setSize] = useState(ESTIMATED);
  const liveRef = useRef<Live | null>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  // Latest-value refs for the document listeners below, which are registered
  // once per suppression state rather than once per render.
  const askRef = useRef<() => void>(() => {});
  useEffect(() => {
    liveRef.current = live;
  }, [live]);
  useEffect(() => {
    askRef.current = () => {
      const current = liveRef.current;
      if (!current || !drawer) return;
      const context = pageContextFor(pathname, searchParams, dateToISO(new Date()));
      drawer.draft(selectionQuestion(current.text), withSelection(context, current.text));
      window.getSelection()?.removeAllRanges();
      setLive(null);
    };
  });

  useEffect(() => {
    if (suppressed) return;
    let timer: number | null = null;

    function read() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setLive(null);
        return;
      }
      const text = normaliseSelection(selection.toString());
      const anchor = selection.anchorNode;
      const element = anchor instanceof Element ? anchor : anchor?.parentElement;
      if (!text || !element) {
        setLive(null);
        return;
      }
      const ignored = isIgnoredSelectionTarget(
        element.tagName,
        element instanceof HTMLElement && element.isContentEditable,
        element.closest('[role="dialog"]') !== null,
      );
      if (ignored) {
        setLive(null);
        return;
      }
      const box = selection.getRangeAt(0).getBoundingClientRect();
      if (box.width === 0 && box.height === 0) {
        setLive(null);
        return;
      }
      setLive({ text, rect: { top: box.top, left: box.left, width: box.width, height: box.height } });
    }
    function onSelectionChange() {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(read, DEBOUNCE_MS);
    }
    function onScroll() {
      if (liveRef.current) setLive(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (!liveRef.current) return;
      if (event.key === "Escape") {
        setLive(null);
        return;
      }
      // Capture phase, so with a selection the shortcut asks instead of
      // reaching the provider's plain open/close toggle.
      if (isChatDrawerShortcut(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        askRef.current();
      }
    }
    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [suppressed]);

  // Measure once the bubble exists so the placement uses its real size.
  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    if (box.width && box.height && (box.width !== size.width || box.height !== size.height)) {
      setSize({ width: box.width, height: box.height });
    }
  }, [live, size.width, size.height]);

  if (suppressed || !live) return null;

  const placed = bubblePosition(live.rect, size, {
    width: window.innerWidth,
    height: window.innerHeight,
  });
  // Only reached on the client (a selection needs a document), so the UA is real.
  const shortcut = shortcutLabel(navigator.userAgent);

  return (
    <button
      ref={bubbleRef}
      type="button"
      data-selection-ask
      aria-label={`Ask Glisp about the highlighted text (${shortcut})`}
      title={`Ask Glisp about this · ${shortcut}`}
      // Keep the selection: a mousedown anywhere else collapses it before click.
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => askRef.current()}
      style={{ top: placed.top, left: placed.left }}
      className="glisp-appear fixed z-50 inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-ai shadow-sm outline-none transition-colors hover:bg-ai/10 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <GlispIcon className="size-3.5" aria-hidden />
      Ask Glisp
    </button>
  );
}
