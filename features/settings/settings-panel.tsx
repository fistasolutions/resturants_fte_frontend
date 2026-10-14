import { forwardRef } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The one panel style of Settings (SPEC-324): a card with a header (title, description, an
 * optional action), stacked rows, and an optional footer — a hint on the left, the save on the
 * right. Every tab composes these, so every setting reads the same way.
 */

export const SettingsPanel = forwardRef<
  HTMLElement,
  {
    title: string;
    description?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    action?: React.ReactNode;
    footer?: React.ReactNode;
    tone?: "default" | "danger";
    highlighted?: boolean;
    id?: string;
    className?: string;
    children?: React.ReactNode;
  }
>(function SettingsPanel(
  { title, description, icon: Icon, action, footer, tone = "default", highlighted, id, className, children },
  ref,
) {
  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn(
        "overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs",
        tone === "danger" ? "border-destructive/30" : "border-border",
        highlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
    >
      <header className="flex flex-wrap items-start gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2
            id={id ? `${id}-title` : undefined}
            className={cn(
              "flex items-center gap-2 text-base font-semibold tracking-tight",
              tone === "danger" && "text-destructive",
            )}
          >
            {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden /> : null}
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-[72ch] text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
      </header>
      {children ? <div className="border-t border-border">{children}</div> : null}
      {footer ? (
        <footer className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/40 px-5 py-3 sm:px-6">
          {footer}
        </footer>
      ) : null}
    </section>
  );
});

/** One setting: what it is on the left, the control on the right; stacked on a phone. */
export function SettingRow({
  label,
  description,
  htmlFor,
  children,
  align = "end",
  className,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const Label = htmlFor ? "label" : "div";
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 border-t border-border px-5 py-4 first:border-t-0 sm:px-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-center md:gap-8",
        className,
      )}
    >
      <Label {...(htmlFor ? { htmlFor } : {})} className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </Label>
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-center gap-2",
          align === "end" ? "md:justify-end" : "md:justify-start",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** The footer's left side: a quiet explanation that grows to push the actions right. */
export function PanelHint({ children }: { children: React.ReactNode }) {
  return <p className="min-w-0 flex-1 text-sm text-muted-foreground">{children}</p>;
}

export type SaveState = "idle" | "saving" | "saved" | "error";

/** "Saving…" / "Saved" beside a save button — announced, never animated in. */
export function SaveStatus({ state, error }: { state: SaveState; error?: string | null }) {
  if (state === "saving") {
    return (
      <span role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span role="status" className="flex items-center gap-1.5 text-sm text-success">
        <Check className="size-3.5" aria-hidden />
        Saved
      </span>
    );
  }
  if (state === "error") {
    return (
      <span role="alert" className="text-sm text-destructive">
        {error ?? "Could not save. Try again."}
      </span>
    );
  }
  return null;
}

/** A value shown, not edited — with where it comes from. */
export function ReadOnlyValue({ value, source }: { value: React.ReactNode; source?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium text-foreground">{value}</span>
      {source ? <span className="text-xs text-muted-foreground">{source}</span> : null}
    </span>
  );
}
