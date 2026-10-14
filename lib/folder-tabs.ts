/**
 * Folder tabs (SPEC-325) — which sides of a scrolling tab bar have more tabs past the edge, so the
 * bar can fade that side. Pure. A 2 px tolerance absorbs sub-pixel scroll positions.
 */
export function scrollEdges(
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
): { moreStart: boolean; moreEnd: boolean } {
  const overflow = scrollWidth - clientWidth > 2;
  return {
    moreStart: overflow && scrollLeft > 2,
    moreEnd: overflow && scrollLeft + clientWidth < scrollWidth - 2,
  };
}
