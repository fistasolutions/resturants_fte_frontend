/**
 * A list fold (SPEC-233): the first `limit` items stay, the rest go behind a "Show N
 * more" button — never a scroll box inside a panel. The same cut Attention (SPEC-224)
 * and Decisions (SPEC-231) make; this is the generic form the Dashboard uses for
 * movers and top products.
 */

export const MOVERS_LIMIT = 5;
export const TOP_PRODUCTS_LIMIT = 5;

export function foldItems<T>(items: T[], limit: number): { shown: T[]; hidden: T[] } {
  return { shown: items.slice(0, limit), hidden: items.slice(limit) };
}

/** "Show 5 more products" / "Show 1 more product". */
export function showMoreLabel(count: number, noun: string): string {
  return `Show ${count} more ${noun}${count === 1 ? "" : "s"}`;
}
