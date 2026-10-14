"use client";

import { useEffect, useRef } from "react";

import { scrollEdges } from "@/lib/folder-tabs";
import { cn } from "@/lib/utils";

/**
 * Folder tabs (SPEC-325) — the one tab bar of the app. `FolderTabBar` holds the tabs, each one a
 * link or button styled by `folderTab(active)`; `FolderPanel` is the body the active tab opens into,
 * placed directly after the bar. On a narrow screen the bar scrolls sideways with a fade on the
 * side that has more tabs, and the open tab is brought into view. Styles live in `globals.css`
 * (`.folder-*`), on the `--tab-panel` token.
 */

export function folderTab(active: boolean, className?: string): { className: string; "data-active"?: "" } {
  return active
    ? { className: cn("folder-tab", className), "data-active": "" }
    : { className: cn("folder-tab", className) };
}

export function FolderTabBar({
  label,
  role = "navigation",
  className,
  children,
}: {
  /** What the tabs switch between, for screen readers ("Orders view"). */
  label: string;
  /** `tablist` for bars whose tabs are `role="tab"`; otherwise a navigation landmark. */
  role?: "navigation" | "tablist";
  className?: string;
  children: React.ReactNode;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const list = listRef.current;
    if (!bar || !list) return;

    const update = () => {
      const edges = scrollEdges(list.scrollLeft, list.clientWidth, list.scrollWidth);
      bar.toggleAttribute("data-more-start", edges.moreStart);
      bar.toggleAttribute("data-more-end", edges.moreEnd);
    };
    const active = list.querySelector<HTMLElement>("[data-active]");
    if (active) {
      const left = active.offsetLeft - 16;
      const right = active.offsetLeft + active.offsetWidth + 16 - list.clientWidth;
      if (list.scrollLeft > left) list.scrollLeft = Math.max(0, left);
      else if (list.scrollLeft < right) list.scrollLeft = right;
    }
    update();
    list.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => {
      list.removeEventListener("scroll", update);
      observer.disconnect();
    };
  });

  const Tag = role === "tablist" ? "div" : "nav";
  return (
    <div ref={barRef} className={cn("folder-tabbar", className)}>
      <Tag
        ref={listRef}
        {...(role === "tablist" ? { role: "tablist" } : {})}
        aria-label={label}
        className="folder-tabs"
      >
        {children}
      </Tag>
    </div>
  );
}

export function FolderPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("folder-panel", className)}>{children}</div>;
}
