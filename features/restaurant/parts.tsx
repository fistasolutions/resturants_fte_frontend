"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** A purposeful empty state: what is missing and the one thing that fills it. */
export function EmptyPanel({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** A small labelled figure, for detail headers and statement totals. */
export function Figure({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-border bg-card px-3 py-2", className)}>
      <p className="truncate text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="truncate text-lg font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** A form's error line — announced to screen readers. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

/** Content-only skeleton for a restaurant page: a strip, then two panels. */
export function RestaurantSkeleton({ tiles = 5 }: { tiles?: number }) {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: tiles }, (_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

/** A table's numeric cell. */
export function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{children}</span>;
}
