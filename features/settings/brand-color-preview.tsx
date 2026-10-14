import type { CSSProperties } from "react";
import { LayoutDashboard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BrandTheme, BrandVars, ThemeName } from "@/lib/brand-color";
import { cn } from "@/lib/utils";

const THEMES: Array<{ name: ThemeName; label: string }> = [
  { name: "light", label: "Light theme" },
  { name: "dark", label: "Dark theme" },
];

/** The theme's brand variables as a scoped style — they reach this box and nothing else. */
function scoped(vars: BrandVars): CSSProperties {
  return Object.fromEntries(Object.entries(vars)) as CSSProperties;
}

/**
 * The live preview (SPEC-322 §3): the things a brand colour changes — a primary button, the
 * active navigation item, a link, a focus ring and a tag — in both themes side by side,
 * whatever theme the page is in. Each box carries its theme's class (`light` / `dark`, which
 * `globals.css` scopes) and the chosen colour's variables as a style on the box only; with no
 * theme it shows the platform's own colours. `inert`: a picture of controls, not controls.
 */
export function BrandColorPreview({ theme }: { theme: BrandTheme | null }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {THEMES.map(({ name, label }) => (
        <figure key={name} className="space-y-2">
          <figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>
          <div
            inert
            className={cn(name, "space-y-3 rounded-lg border border-border bg-background p-4 text-foreground")}
            style={theme ? scoped(theme[name]) : undefined}
          >
            <div className="rounded-md bg-sidebar p-1">
              <div className="relative flex h-8 items-center gap-2 rounded-md bg-sidebar-accent px-2 text-sm font-medium text-sidebar-accent-foreground after:absolute after:top-1/2 after:left-0 after:h-4 after:w-0.5 after:-translate-y-1/2 after:rounded-full after:bg-brand">
                <LayoutDashboard className="size-4" aria-hidden />
                Dashboard
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Save changes</Button>
              <span className="text-sm font-medium text-primary underline underline-offset-4">View report</span>
              <Badge>New</Badge>
            </div>
            <div className="flex h-9 items-center rounded-md border border-ring bg-card px-3 text-sm text-muted-foreground ring-[3px] ring-ring/50">
              A focused field
            </div>
          </div>
        </figure>
      ))}
    </div>
  );
}
