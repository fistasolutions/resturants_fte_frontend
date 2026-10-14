/**
 * Derive up-to-two-letter initials from a display name for avatar fallbacks
 * (SPEC-094 UI polish). Pure + unit-tested. Falls back to "?" for empty input
 * and to the first character when only one token is present.
 */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "?";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
}
