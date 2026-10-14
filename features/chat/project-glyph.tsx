import { createElement } from "react";

import { colorText, projectIcon } from "@/lib/project-style";
import { cn } from "@/lib/utils";

/** A project's icon in its colour (SPEC-255). */
export function ProjectGlyph({
  icon,
  color,
  className,
}: {
  icon: string;
  color: string;
  className?: string;
}) {
  return createElement(projectIcon(icon), {
    className: cn("shrink-0", colorText(color), className),
    "aria-hidden": true,
  });
}
