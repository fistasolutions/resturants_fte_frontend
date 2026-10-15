/**
 * Restaurant API adapters (frontend SPEC-377). The backend speaks snake_case; the views read
 * camelCase. One pure converter does it, leaving alone the maps whose KEYS are data: the KPI
 * record (`KpiKey`), the menu-class counts (`MenuClass`), a CSV import's column mapping and its
 * preview rows, a topping's prices by size name, a branch's hours by weekday and a drawer's totals by
 * movement kind.
 */

const PRESERVE_KEYS = new Set(["kpis", "counts", "columns", "preview", "size_prices", "hours", "by_kind"]);

function camelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
}

function convert(value: unknown, preserve: boolean): unknown {
  if (Array.isArray(value)) return value.map((item) => convert(item, preserve));
  if (value === null || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    if (preserve) {
      // Keep this level's keys; still convert the values' own fields (a KPI's `previous`).
      out[key] = convert(inner, false);
    } else {
      out[camelKey(key)] = PRESERVE_KEYS.has(key) ? convertPreserved(key, inner) : convert(inner, false);
    }
  }
  return out;
}

function convertPreserved(key: string, value: unknown): unknown {
  // A preview row is the POS's own record — keep it exactly as sent.
  if (key === "preview") return value;
  return convert(value, true);
}

/** snake_case JSON → the view model it is declared as. */
export function fromApi<T>(json: unknown): T {
  return convert(json, false) as T;
}

/** A view model's fields → the snake_case body a write sends. Shallow: request bodies are flat. */
export function toApi(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    out[key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`)] = value;
  }
  return out;
}
