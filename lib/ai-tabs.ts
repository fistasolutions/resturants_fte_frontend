/**
 * Which AI Performance routes the persistent shell owns (SPEC-229).
 *
 * There is one shell route today — `/ai` — so the shell renders a header and the
 * period picker, and no tab bar: a bar with one tab is decoration. The list is kept
 * here rather than inlined as `pathname === "/ai"` so adding the second route is one
 * line in one place, and so the rule is unit-testable.
 */

export const AI_SHELL_ROUTES = ["/ai"] as const;

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * True on exactly the routes that get the section header.
 *
 * `/ai/traces/[traceId]` is deliberately false: it carries its own title and its own
 * back link, and the period picker means nothing on a single run.
 */
export function isAiShellRoute(pathname: string): boolean {
  return (AI_SHELL_ROUTES as readonly string[]).includes(normalizePath(pathname));
}
