/** Money pages reads (frontend SPEC-308, backend SPEC-304) — defined once, run on
 * either transport (SPEC-230). */

import {
  adaptMoneyPageDraft,
  adaptMoneyPages,
  type MoneyPageDraft,
  type MoneyPagesData,
} from "@/lib/money-pages";
import { defineQuery } from "@/lib/query-def";

export const moneyPagePaths = {
  list: (refresh = false): string => (refresh ? "/money-pages?refresh=true" : "/money-pages"),
  draft: (id: number): string => `/money-pages/drafts/${id}`,
} as const;

export const moneyPageQueries = {
  /** The ranked list. Served from the day's snapshot — the backend spends one Search
   * Console call a day, so this is cheap enough to prefetch with the tab. */
  list: () =>
    defineQuery<MoneyPagesData>(["money-pages", "list"], async (api) =>
      adaptMoneyPages(await api<Record<string, unknown>>(moneyPagePaths.list())),
    ),
  draft: (id: number) =>
    defineQuery<MoneyPageDraft>(["money-pages", "draft", id], async (api) =>
      adaptMoneyPageDraft(await api<Record<string, unknown>>(moneyPagePaths.draft(id))),
    ),
} as const;
