import { cn } from "@/lib/utils";

/**
 * The platform's logo — the same mark as the marketing site (`ecommerce-fte/components/ui.tsx`):
 * the E tile followed by "commerce", together reading "Ecommerce". Drawn as SVG so it follows
 * the theme from tokens alone: the tile takes the text colour, the E is cut out in `paper` (the
 * colour of whatever it sits on), and the underline is the brand red.
 */
export function BrandLogo({
  size = "md",
  paper = "var(--background)",
  className,
}: {
  size?: "sm" | "md" | "lg";
  /** The surface colour the E is cut out in — the colour behind the logo. */
  paper?: string;
  className?: string;
}) {
  const dims = {
    sm: { icon: "size-6", text: "text-base" },
    md: { icon: "size-8", text: "text-xl" },
    lg: { icon: "size-10", text: "text-2xl" },
  }[size];
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label="Ecommerce">
      <BrandMark className={dims.icon} paper={paper} />
      <span aria-hidden className={cn(dims.text, "leading-none font-semibold tracking-tight")}>
        commerce
      </span>
    </span>
  );
}

/** The E tile alone, for places too small for the full logo. Decorative: label its container. */
export function BrandMark({
  className,
  paper = "var(--background)",
}: {
  className?: string;
  paper?: string;
}) {
  return (
    <svg viewBox="0 0 512 512" className={cn("shrink-0", className)} aria-hidden>
      <rect width="512" height="512" rx="104" fill="currentColor" />
      <path d="M176 124H338V170H228V220H330V264H228V320H338V366H176Z" style={{ fill: paper }} />
      <rect x="186" y="394" width="140" height="22" rx="11" style={{ fill: "var(--brand)" }} />
    </svg>
  );
}
