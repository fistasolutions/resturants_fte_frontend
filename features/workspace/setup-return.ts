/**
 * Setup's return memory (SPEC-361): while the person is away connecting an app from Setup (or
 * from a page's connect screen), this tab remembers which step it was and the page to come back
 * to. `sessionStorage` is per tab and survives the round trip through Google or Intuit; every
 * access is guarded, because a private window can refuse storage — Setup then simply does not
 * bring the person back.
 */
import { parseReturn, type ReturnMemory } from "@/lib/setup-checklist";

const KEY = "fte.setup.return";
export const SETUP_RETURN_EVENT = "fte:setup-return";

export function readReturn(): ReturnMemory | null {
  try {
    return parseReturn(window.sessionStorage.getItem(KEY), Date.now());
  } catch {
    return null;
  }
}

export function rememberReturn(entry: Omit<ReturnMemory, "at">): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ ...entry, at: Date.now() }));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(SETUP_RETURN_EVENT));
}

export function clearReturn(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(SETUP_RETURN_EVENT));
}
