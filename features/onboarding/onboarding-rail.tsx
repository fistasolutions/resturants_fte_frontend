import { Check } from "lucide-react";

import { railStates, type OnboardingStep } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/** Where the person is in the four steps — drawn, never animated. */
export function OnboardingRail({ step }: { step: OnboardingStep }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Setup progress">
      {railStates(step).map((item, i) => (
        <li key={item.label} className="flex flex-1 items-center gap-2">
          <span
            aria-current={item.state === "current" ? "step" : undefined}
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
              item.state === "done" && "border-primary bg-primary text-primary-foreground",
              item.state === "current" && "border-primary text-foreground",
              item.state === "next" && "border-border text-muted-foreground",
            )}
          >
            {item.state === "done" ? <Check className="size-3.5" aria-hidden /> : i + 1}
          </span>
          <span
            className={cn(
              "text-xs",
              item.state === "next" ? "text-muted-foreground" : "font-medium text-foreground",
            )}
          >
            {item.label}
          </span>
          {i < 3 ? <span className="h-px flex-1 bg-border" aria-hidden /> : null}
        </li>
      ))}
    </ol>
  );
}
