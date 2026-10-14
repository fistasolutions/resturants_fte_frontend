/**
 * The words on a confirmation (frontend SPEC-304).
 *
 * Pure half: every destructive action in the app asks the same way, so the wording is
 * written once here rather than in eight `window.confirm` strings.
 */

export interface ConfirmCopy {
  title: string;
  body: string;
  confirmLabel: string;
  destructive: boolean;
}

export type ConfirmKind =
  | "thread"
  | "fact"
  | "facts"
  | "source"
  | "run"
  | "schedules";

/** Curly quotes, because the name is the owner's own text. */
export function quoted(subject: string): string {
  return `“${subject}”`;
}

export function confirmCopy(kind: ConfirmKind, subject = "", count = 0): ConfirmCopy {
  switch (kind) {
    case "thread":
      return {
        title: `Delete ${quoted(subject)}?`,
        body: "Its messages go with it.",
        confirmLabel: "Delete",
        destructive: true,
      };
    case "fact":
      return {
        title: `Delete ${quoted(subject)}?`,
        body: "The writers stop reading it at once.",
        confirmLabel: "Delete",
        destructive: true,
      };
    case "facts":
      return {
        title: `Delete ${count} ${count === 1 ? "fact" : "facts"}?`,
        body: "The writers stop reading them at once.",
        confirmLabel: "Delete",
        destructive: true,
      };
    case "source":
      return {
        title: `Remove ${quoted(subject)}?`,
        body: "Everything you approved, confirmed or switched on stays.",
        confirmLabel: "Remove",
        destructive: true,
      };
    case "run":
      return {
        title: `Delete ${quoted(subject)}?`,
        body: "Its deliveries go with it. This cannot be undone.",
        confirmLabel: "Delete",
        destructive: true,
      };
    case "schedules":
      return {
        title: "Pause every schedule?",
        body: "Nothing will run or send until you turn them back on.",
        confirmLabel: "Pause all",
        destructive: false,
      };
  }
}
