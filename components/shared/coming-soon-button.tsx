import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComingSoonButtonProps {
  label: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}

/**
 * A visible action whose destination page hasn't shipped yet (Phase 1).
 * Renders honestly disabled with a "Coming soon" tooltip — never a dead link.
 * Each page spec replaces its instances with real links as routes ship.
 */
export function ComingSoonButton({
  label,
  variant = "ghost",
  size = "sm",
  className,
}: ComingSoonButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>
          <Button
            variant={variant}
            size={size}
            disabled
            aria-disabled="true"
            className="pointer-events-none"
          >
            {label}
            <span className="sr-only"> (coming soon)</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  );
}
