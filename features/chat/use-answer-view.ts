"use client";

import { useSyncExternalStore } from "react";

import { readAnswerView, writeAnswerView, type AnswerView } from "@/lib/answer-visual";

/** SPEC-257: the text ⇄ chart choice, shared by every answer card and
 * remembered per browser. */
let view: AnswerView | null = null;
const listeners = new Set<() => void>();

function current(): AnswerView {
  if (view === null) view = readAnswerView();
  return view;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAnswerView(next: AnswerView): void {
  view = next;
  writeAnswerView(next);
  listeners.forEach((listener) => listener());
}

export function useAnswerView(): [AnswerView, (next: AnswerView) => void] {
  const value = useSyncExternalStore(subscribe, current, () => "text" as const);
  return [value, setAnswerView];
}
