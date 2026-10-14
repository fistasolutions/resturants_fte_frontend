import Image from "next/image";

import { cn } from "@/lib/utils";

const SIZE = {
  sm: { tile: "size-7 rounded-lg", px: 18 },
  md: { tile: "size-10 rounded-[10px]", px: 24 },
  lg: { tile: "size-14 rounded-2xl", px: 34 },
} as const;

/**
 * An app's own logo on a light tile (SPEC-328 Patches). Like the sign-in marks in
 * `provider-marks.tsx`, a third-party mark keeps its owner's colours; the tile is the
 * `--logo-tile` token — light in both themes — so a dark mark (Klaviyo's black flag) stays
 * visible in dark mode. Decorative: the app's name is always beside it.
 */
export function AppLogo({
  src,
  size = "md",
  className,
}: {
  src: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const { tile, px } = SIZE[size];
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center border bg-logo-tile", tile, className)}
    >
      <Image src={src} alt="" width={px} height={px} unoptimized className="object-contain" />
    </span>
  );
}
