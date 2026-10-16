/**
 * Parsing for the restaurant pages' small form dialogs (SPEC-398). Each bound mirrors the backend's
 * own schema, so the dialog refuses exactly what the server would.
 */

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** A shift's break: a whole number of minutes, 0–600 (backend `ShiftFixIn`). */
export function parseBreakMinutes(raw: string): Parsed<number> {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return { ok: false, error: "Enter the break as a whole number of minutes." };
  const minutes = Number(text);
  if (minutes > 600) return { ok: false, error: "A break can be at most 600 minutes." };
  return { ok: true, value: minutes };
}

/** A percent as typed — "6", "6.5" or "6%" — as a rate (0.06), 0–100% (backend `SignIn`). */
export function parsePercentRate(raw: string, label: string): Parsed<number> {
  const text = raw.replace("%", "").trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, error: `Enter the ${label} as a percent, like 6 or 6.5.` };
  const percent = Number(text);
  if (percent > 100) return { ok: false, error: `The ${label} cannot be above 100%.` };
  return { ok: true, value: Math.round(percent * 100) / 10000 };
}

/** A new branch's store number: trimmed, 1–40 characters (backend `OpenStoreIn`). */
export function parseStoreCode(raw: string): Parsed<string> {
  const code = raw.trim();
  if (!code) return { ok: false, error: "Enter the new branch's store number." };
  if (code.length > 40) return { ok: false, error: "A store number can be at most 40 characters." };
  return { ok: true, value: code };
}
