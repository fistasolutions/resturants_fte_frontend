/**
 * The eye on a secret field (frontend SPEC-302 / backend SPEC-297).
 *
 * Pure half: what the button announces in each state, whether it may be pressed at all,
 * and what the box says while the value is hidden. The card stays presentational, so this
 * is what Vitest covers.
 */

export type SecretSource = "database" | "env" | "unset";

export interface SecretStatus {
  configured: boolean;
  source: SecretSource;
}

/** What the box shows while the value is hidden. */
export function maskedPlaceholder(status: SecretStatus | undefined): string {
  if (!status?.configured) return "Not configured";
  return status.source === "env" ? "Set in the server environment" : "Configured on the server";
}

/** Only a configured field has something to reveal. */
export function canReveal(status: SecretStatus | undefined): boolean {
  return Boolean(status?.configured);
}

/** The button's title and aria-label — it says what pressing it will do. */
export function revealTitle(status: SecretStatus | undefined, revealed: boolean): string {
  if (!canReveal(status)) return "Nothing is configured yet";
  return revealed ? "Hide this value" : "Show this value";
}

/** A revealed field is read-only: a stray keypress must not half-edit a credential. */
export function isReadOnlyWhileRevealed(revealed: boolean): boolean {
  return revealed;
}

/** The input's type — `text` only while revealed, so no password manager offers to save it. */
export function inputType(revealed: boolean): "text" | "password" {
  return revealed ? "text" : "password";
}

/** The line under the box: how to change it, or where the value came from. */
export function secretHint(status: SecretStatus | undefined, revealed: boolean): string {
  if (!status?.configured) return "";
  if (revealed) {
    return status.source === "env"
      ? "Read from the server environment. Hide it, then type to override it here."
      : "Hide it, then type a new value to replace it.";
  }
  return "Type a new value to replace it.";
}

/**
 * What a press of the eye should do (SPEC-302 Patch).
 *
 * `hide` when it is on screen; `show` when this card has already read it — the value is
 * kept until a save replaces it, so hiding and showing again costs nothing; `fetch` only
 * the first time.
 */
export function revealAction(
  key: string,
  shown: Record<string, true>,
  fetched: Record<string, string>,
): "hide" | "show" | "fetch" {
  if (key in shown) return "hide";
  return key in fetched ? "show" : "fetch";
}
