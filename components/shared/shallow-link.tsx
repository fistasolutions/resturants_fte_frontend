"use client";

import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";

interface ShallowLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** Replace the history entry rather than add one — for typed filters, not tabs. */
  replace?: boolean;
}

/**
 * A link that changes the URL on the same page without asking the server (SPEC-301).
 *
 * Next 16 keeps `useSearchParams` in step with the browser's own `history.pushState`, so a
 * tab or a filter that only changes the query string can move the URL in place: no RSC
 * request, no server prefetch, no refetch — the view re-renders from the client cache in
 * one frame, and back/forward still work because the URL really moved.
 *
 * It is a real `<a href>`: a middle-click, a ⌘-click or "open in new tab" do the ordinary
 * thing. Only a plain left click is taken over.
 */
export const ShallowLink = forwardRef<HTMLAnchorElement, ShallowLinkProps>(function ShallowLink(
  { href, replace = false, onClick, ...props },
  ref,
) {
  function handle(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank"
    ) {
      return;
    }
    event.preventDefault();
    if (replace) window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
  }
  return <a ref={ref} href={href} onClick={handle} {...props} />;
});
