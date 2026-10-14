/**
 * A flow's journey as rows for a vertical step diagram (SPEC-345) — pure. Splits nest:
 * each branch's steps sit one level in, labelled yes or no, so the DOM can draw the whole
 * journey with borders and indents, no canvas library.
 */
import type { FlowStep } from "@/types/email-marketing";

export interface FlowRow {
  step: FlowStep;
  depth: number;
  /** The branch this row sits on, for a step inside a split. */
  branch: "yes" | "no" | null;
  /** The first row of a branch carries its label. */
  branchStart: boolean;
}

export function layoutFlow(steps: readonly FlowStep[], depth = 0, branch: "yes" | "no" | null = null): FlowRow[] {
  const rows: FlowRow[] = [];
  steps.forEach((step, index) => {
    rows.push({ step, depth, branch, branchStart: branch !== null && index === 0 });
    if (step.kind === "split") {
      rows.push(...layoutFlow(step.yes, depth + 1, "yes"));
      rows.push(...layoutFlow(step.no, depth + 1, "no"));
    }
  });
  return rows;
}

export type FlowMessage = Extract<FlowStep, { kind: "message" }>;

/** Every message in the flow, in journey order, across branches. */
export function flowMessages(steps: readonly FlowStep[]): FlowMessage[] {
  return layoutFlow(steps)
    .map((row) => row.step)
    .filter((step): step is FlowMessage => step.kind === "message");
}

export function findMessage(steps: readonly FlowStep[], id: string): FlowMessage | null {
  return flowMessages(steps).find((message) => message.id === id) ?? null;
}

/** The longest path's total wait, in hours. */
export function journeyHours(steps: readonly FlowStep[]): number {
  let total = 0;
  for (const step of steps) {
    if (step.kind === "delay") total += step.hours;
    if (step.kind === "split") total += Math.max(journeyHours(step.yes), journeyHours(step.no));
  }
  return total;
}

export function delayLabel(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} day${days === 1 ? "" : "s"}`;
}
