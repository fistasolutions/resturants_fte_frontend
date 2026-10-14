import type { ComponentType, SVGProps } from "react";

/** What a Lucide icon and `GlispIcon` have in common — for icon tables. */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** A loop that runs only while the state is true (SPEC-252). */
export type GlispState = "rest" | "thinking" | "reading" | "streaming" | "generating" | "online";
/** A one-shot the caller sets for its duration (SPEC-252, `GLISP_MOTION_MS`). */
export type GlispMotion = "send" | "pop" | "nod" | "shake";

interface GlispIconProps extends SVGProps<SVGSVGElement> {
  /**
   * `mark` (default): the five rays and the red dot alone, drawn in `currentColor`
   * at a line weight that survives 12–20 px — the glyph for buttons, pills and
   * labels, exactly where a Lucide icon would sit. `tile`: the icon file itself,
   * rounded background included, for avatars (the launcher pill, the panel header).
   */
  variant?: "mark" | "tile";
  state?: GlispState;
  motion?: GlispMotion;
}

const RAYS = [
  { n: 1, mark: "M304,248 Q470,248 680,512", tile: "M304,224 Q454.36,224 662,502 L662,522 Q454.36,272 304,272 Z", cap: [304, 248, 24] },
  { n: 2, mark: "M268,380 Q450,380 680,512", tile: "M268,353 Q433.48,353 662,502 L662,522 Q433.48,407 268,407 Z", cap: [268, 380, 27] },
  { n: 3, mark: "M256,512 L680,512", tile: "M256,482 Q426.52,482 662,502 L662,522 Q426.52,542 256,542 Z", cap: [256, 512, 30] },
  { n: 4, mark: "M268,644 Q450,644 680,512", tile: "M268,617 Q433.48,617 662,502 L662,522 Q433.48,671 268,671 Z", cap: [268, 644, 27] },
  { n: 5, mark: "M304,776 Q470,776 680,512", tile: "M304,752 Q454.36,752 662,502 L662,522 Q454.36,800 304,800 Z", cap: [304, 776, 24] },
] as const;

/**
 * Glisp — the analyst's icon (SPEC-248), from `ref/icon/glisp-icon-*-v2.svg`.
 * Theme-driven with tokens (root Rule 9): the tile is the foreground token, its
 * strokes the background token, the focal dot `--brand` — so light theme shows the
 * dark file and dark theme the light one, with no second asset. A drop-in for a
 * Lucide icon: `<GlispIcon className="size-4" aria-hidden />`. Motion (SPEC-252)
 * is CSS keyed on `data-glisp-state` / `data-glisp-motion` — see `globals.css`.
 */
export function GlispIcon({
  variant = "mark",
  state = "rest",
  motion,
  className,
  ...props
}: GlispIconProps) {
  const data = {
    "data-glisp": variant,
    "data-glisp-state": state === "rest" ? undefined : state,
    "data-glisp-motion": motion,
  };
  if (variant === "tile") {
    return (
      <svg viewBox="0 0 1024 1024" className={className} xmlns="http://www.w3.org/2000/svg" {...data} {...props}>
        <rect x="18" y="18" width="988" height="988" rx="218" fill="var(--foreground)" />
        <g fill="var(--background)">
          {RAYS.map((r) => (
            <g key={r.n} className={`glisp-ray glisp-r${r.n}`}>
              <path d={r.tile} />
              <circle cx={r.cap[0]} cy={r.cap[1]} r={r.cap[2]} />
            </g>
          ))}
        </g>
        <circle className="glisp-ring" cx="712" cy="512" r="64" fill="none" stroke="var(--brand)" strokeWidth="24" />
        <circle cx="712" cy="512" r="64" fill="var(--background)" />
        <circle className="glisp-dot" cx="712" cy="512" r="52" fill="var(--brand)" />
      </svg>
    );
  }
  // The same five rays converging on the dot, as round-capped strokes heavy enough
  // to read at icon size (≈2 px at 16 px); no background, so it takes the text
  // colour of wherever it sits, like any other glyph.
  return (
    <svg
      viewBox="180 200 720 624"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="96"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...data}
      {...props}
    >
      <circle className="glisp-ring" cx="760" cy="512" r="112" stroke="var(--brand)" strokeWidth="40" />
      {RAYS.map((r) => (
        <path key={r.n} className={`glisp-ray glisp-r${r.n}`} pathLength={100} d={r.mark} />
      ))}
      <circle className="glisp-dot" cx="760" cy="512" r="112" fill="var(--brand)" stroke="none" />
    </svg>
  );
}
