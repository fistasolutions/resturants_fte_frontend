import { Database, FileText, PenLine, UserRoundCheck } from "lucide-react";

import { GlispIcon, type IconComponent } from "@/components/shared/glisp-icon";

import { cn } from "@/lib/utils";
import type { ProvenanceSource } from "@/types/spotlight";

/**
 * The core Spotlight UI primitive (SPEC-109): a small chip declaring *how* a
 * Brand Brain fact is known. Token-only treatments — no invented colors:
 *   onboarding → secondary · measured → success tint · research → muted +
 *   the Glisp icon (AI research) · manual → outline · file → primary tint (SPEC-263:
 *   extracted from an uploaded source, approved by the owner). `measured` deliberately
 *   reads "I don't author these numbers, they come from live Shopify data."
 */
const CONFIG: Record<
  ProvenanceSource,
  { label: string; className: string; Icon: IconComponent }
> = {
  onboarding: {
    label: "Onboarding",
    className: "bg-secondary text-secondary-foreground",
    Icon: UserRoundCheck,
  },
  measured: {
    label: "Measured",
    className: "bg-success/10 text-success",
    Icon: Database,
  },
  research: {
    label: "Research",
    className: "bg-muted text-foreground",
    Icon: GlispIcon,
  },
  manual: {
    label: "Manual",
    className: "border border-border text-muted-foreground",
    Icon: PenLine,
  },
  file: {
    label: "File",
    className: "bg-primary/10 text-primary",
    Icon: FileText,
  },
};

export function ProvenanceChip({
  source,
  className,
}: {
  source: ProvenanceSource;
  className?: string;
}) {
  const { label, className: tone, Icon } = CONFIG[source];
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl px-2 text-[0.6875rem] font-medium",
        tone,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
