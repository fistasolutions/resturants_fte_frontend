/**
 * The store's locale for display formatting (SPEC-319) — its currency and its timezone.
 *
 * The formatters in `utils/format.ts` are plain functions called from ~140 files, so they read
 * the locale from here rather than from React context. It is set only in the browser (one
 * organization per tab, by `WorkspaceProvider` before its children render); on the server it is
 * never set, because concurrent renders for different organizations share the process — a
 * server render always formats with the default, and `useApiQuery` keeps a non-default store's
 * data out of the hydration render so the two can never disagree.
 */

export interface StoreLocale {
  /** ISO 4217, e.g. "USD". */
  currency: string;
  /** IANA zone, e.g. "America/New_York". */
  timeZone: string;
}

export const DEFAULT_STORE_LOCALE: StoreLocale = Object.freeze({
  currency: "USD",
  timeZone: "America/New_York",
});

function validCurrency(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false;
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: code });
    return true;
  } catch {
    return false;
  }
}

function validZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The store's own values where they are usable, the default field by field where not. */
export function resolveStoreLocale(
  currency: string | null | undefined,
  timeZone: string | null | undefined,
): StoreLocale {
  const code = (currency ?? "").trim().toUpperCase();
  const zone = (timeZone ?? "").trim();
  return {
    currency: code && validCurrency(code) ? code : DEFAULT_STORE_LOCALE.currency,
    timeZone: zone && validZone(zone) ? zone : DEFAULT_STORE_LOCALE.timeZone,
  };
}

export function isDefaultLocale(locale: StoreLocale): boolean {
  return (
    locale.currency === DEFAULT_STORE_LOCALE.currency &&
    locale.timeZone === DEFAULT_STORE_LOCALE.timeZone
  );
}

let current: StoreLocale = DEFAULT_STORE_LOCALE;

export function getStoreLocale(): StoreLocale {
  return current;
}

/** Set the locale the formatters read. Tests call it directly; the app goes through
 * `syncClientStoreLocale`, which refuses to run on the server. */
export function setStoreLocale(locale: StoreLocale): void {
  current = locale;
}

/** The browser-only setter. On the server it does nothing: a shared setting there would leak
 * one organization's currency into another's concurrent render. */
export function syncClientStoreLocale(locale: StoreLocale): void {
  if (typeof window === "undefined") return;
  if (current.currency !== locale.currency || current.timeZone !== locale.timeZone) {
    current = locale;
  }
}
