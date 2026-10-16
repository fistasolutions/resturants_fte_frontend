/** The Menu Engineer's pure half (frontend SPEC-391 / backend SPEC-409). */
import type { MenuSuggestion, MenuSuggestionKind } from "@/types/restaurant-os";

export const KIND_LABELS: Record<MenuSuggestionKind, string> = {
  reprice: "Re-price",
  retire: "Retire",
  promote: "Push",
  recost: "Add its cost",
};

/** What Accept does, said on the button. */
export const ACCEPT_LABELS: Record<MenuSuggestionKind, string> = {
  reprice: "Apply the new price",
  retire: "Take it off the menu",
  promote: "Mark as done",
  recost: "Mark as done",
};

export const KIND_ORDER: MenuSuggestionKind[] = ["reprice", "retire", "promote", "recost"];

export function byKind(rows: MenuSuggestion[], kind: MenuSuggestionKind | "all"): MenuSuggestion[] {
  return kind === "all" ? rows : rows.filter((r) => r.kind === kind);
}

/** "38%" or "—". */
export function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}
